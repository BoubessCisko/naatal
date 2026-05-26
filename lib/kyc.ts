import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import sha256 from 'crypto-js/sha256';
import {
  account,
  databases,
  storage,
  ID,
  Permission,
  Role,
  DB_ID,
  COLLECTIONS,
  BUCKETS,
} from './appwrite';

// ⚠️ SALT DEV — À REMPLACER PAR UNE FUNCTION APPWRITE EN PROD
// Le NIN hash doit être calculé côté serveur dans une Function avec un salt secret
// stocké en variable d'environnement Appwrite. Hasher côté client expose le salt
// dans le bundle APK (décompilable) — un attaquant peut alors hasher tous les NINs
// connus et faire du reverse lookup.
// TODO Phase 5 : remplacer cette fonction par un appel à `functions.createExecution('hash-nin', { nin })`.
const DEV_NIN_SALT = 'naatal-dev-salt-NOT-FOR-PRODUCTION-v1';

function hashNinDev(nin: string): string {
  return sha256(nin.trim() + DEV_NIN_SALT).toString();
}

// Hint pour cropper le cadre vert. Valeurs en FRACTIONS [0..1] de la zone
// affichée du CameraView — l'appelant calcule en amont à partir des layouts
// mesurés (measureInWindow). Marche uniquement si la CameraView a le même
// aspect ratio que la photo capturée (sinon les fractions sont déformées).
export type CropHint = {
  fracX: number;
  fracY: number;
  fracW: number;
  fracH: number;
};

const ID_RATIO = 1.585;
const FALLBACK_SCALE = 0.85;

// Compresse + rogne la photo. Si cropHint est fourni, applique les fractions
// directement sur les dimensions de la photo. Sinon, rogne centré au ratio CNI.
export async function compressImage(
  uri: string,
  cropHint?: CropHint
): Promise<{ uri: string; size: number }> {
  const original = await ImageManipulator.manipulateAsync(uri, [], {});
  const { width: pw, height: ph } = original;

  let cropX: number;
  let cropY: number;
  let cropW: number;
  let cropH: number;

  if (cropHint) {
    cropX = cropHint.fracX * pw;
    cropY = cropHint.fracY * ph;
    cropW = cropHint.fracW * pw;
    cropH = cropHint.fracH * ph;
  } else {
    // Fallback : rogne centré au ratio CNI sur la dimension la plus large
    const isLandscape = pw > ph;
    if (isLandscape) {
      cropW = pw * FALLBACK_SCALE;
      cropH = cropW / ID_RATIO;
    } else {
      cropH = ph * FALLBACK_SCALE;
      cropW = cropH / ID_RATIO;
    }
    cropX = (pw - cropW) / 2;
    cropY = (ph - cropH) / 2;
  }

  // Clamp pour rester dans les bounds de la photo
  cropX = Math.max(0, Math.round(cropX));
  cropY = Math.max(0, Math.round(cropY));
  cropW = Math.min(pw - cropX, Math.round(cropW));
  cropH = Math.min(ph - cropY, Math.round(cropH));

  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      { crop: { originX: cropX, originY: cropY, width: cropW, height: cropH } },
      { resize: { width: 1600 } },
    ],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  );

  const info = await FileSystem.getInfoAsync(result.uri);
  const size = info.exists ? info.size : 0;
  return { uri: result.uri, size };
}

// Upload via FileSystem.uploadAsync (REST natif Appwrite) + updateFile pour les
// permissions. Contourne le bug "unsupported FormDataPart Implementation" du SDK
// react-native-appwrite avec la nouvelle architecture RN 0.85+. Le SDK utilise
// l'objet FormData JS pour les fichiers, qui crashe avec la new arch sur Android.
async function uploadCniPhoto(
  uri: string,
  ownerId: string,
  side: 'recto' | 'verso'
): Promise<string> {
  const filename = `cni-${ownerId}-${side}-${Date.now()}.jpg`;
  const targetUri = `${FileSystem.cacheDirectory}${filename}`;

  // Copie dans cacheDirectory avec un nom propre (URI plus stable pour l'upload natif)
  await FileSystem.copyAsync({ from: uri, to: targetUri });

  try {
    const fileId = ID.unique();
    const jwt = await account.createJWT();
    const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!;
    const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;
    const url = `${endpoint}/storage/buckets/${BUCKETS.files}/files`;

    const result = await FileSystem.uploadAsync(url, targetUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType: 'image/jpeg',
      parameters: { fileId },
      headers: {
        'X-Appwrite-Project': projectId,
        'X-Appwrite-JWT': jwt.jwt,
      },
    });

    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Upload échoué (${result.status}) : ${result.body}`);
    }

    const body = JSON.parse(result.body) as { $id: string };

    // Pose les permissions (read owner uniquement) via updateFile — pas de multipart
    await storage.updateFile({
      bucketId: BUCKETS.files,
      fileId: body.$id,
      permissions: [Permission.read(Role.user(ownerId))],
    });

    return body.$id;
  } finally {
    FileSystem.deleteAsync(targetUri, { idempotent: true }).catch(() => {});
  }
}

// Complète le KYC : upload des 2 photos (recto + verso) + hash NIN + update profile.
export async function completeKyc(params: {
  fullName: string;
  nin: string;
  photoRectoUri: string;
  photoVersoUri: string;
}): Promise<void> {
  const me = await account.get();

  // Upload en parallèle pour gagner du temps
  const [rectoId, versoId] = await Promise.all([
    uploadCniPhoto(params.photoRectoUri, me.$id, 'recto'),
    uploadCniPhoto(params.photoVersoUri, me.$id, 'verso'),
  ]);

  const ninHash = hashNinDev(params.nin);

  await databases.updateDocument(DB_ID, COLLECTIONS.users, me.$id, {
    full_name: params.fullName.trim(),
    nin_hash: ninHash,
    cni_photo_id: rectoId,
    cni_photo_verso_id: versoId,
    cni_verified: true,
  });
}
