import * as FileSystem from 'expo-file-system/legacy';
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';
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

async function uploadFile(
  uri: string,
  filename: string,
  mimeType: string,
  partyUserIds: string[]
): Promise<{ fileId: string; fileSize: number }> {
  const targetUri = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.copyAsync({ from: uri, to: targetUri });

  try {
    const info = await FileSystem.getInfoAsync(targetUri);
    const fileSize = info.exists ? info.size : 0;

    const fileId = ID.unique();
    const jwt = await account.createJWT();
    const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!;
    const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;
    const url = `${endpoint}/storage/buckets/${BUCKETS.files}/files`;

    const result = await FileSystem.uploadAsync(url, targetUri, {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType,
      parameters: { fileId },
      headers: {
        'X-Appwrite-Project': projectId,
        'X-Appwrite-JWT': jwt.jwt,
      },
    });

    if (result.status < 200 || result.status >= 300) {
      throw new Error(`Upload échoué (${result.status})`);
    }

    const body = JSON.parse(result.body) as { $id: string };

    await storage.updateFile({
      bucketId: BUCKETS.files,
      fileId: body.$id,
      permissions: partyUserIds.map((uid) => Permission.read(Role.user(uid))),
    });

    return { fileId: body.$id, fileSize };
  } finally {
    FileSystem.deleteAsync(targetUri, { idempotent: true }).catch(() => {});
  }
}

// Read entire file as base64 and hash. Audio files are max 10MB (Appwrite
// bucket limit), base64 = ~13MB string — acceptable on modern phones.
// The chunked approach had a bug: concatenating base64 chunks breaks padding
// alignment, producing a wrong hash for multi-chunk files.
async function hashFile(uri: string): Promise<string> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) return sha256('').toString();
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return sha256(Base64.parse(base64)).toString();
}

export async function uploadAndSaveAudio(params: {
  uri: string;
  contractId: string;
  questionIndex: number;
  durationMs: number;
  partyUserIds: string[];
}): Promise<string> {
  const { uri, contractId, questionIndex, durationMs, partyUserIds } = params;
  const me = await account.get();
  const filename = `${contractId}-q${questionIndex}-${Date.now()}.m4a`;

  // Upload file first, then hash. If upload fails we don't waste time hashing.
  const { fileId } = await uploadFile(uri, filename, 'audio/mp4', partyUserIds);

  let fileHash: string;
  try {
    fileHash = await hashFile(uri);
  } catch {
    fileHash = '';
  }

  // Both parties get read permission on the audio_files doc.
  // Only the uploader gets update (for re-record delete).
  const docPermissions = [
    ...partyUserIds.map((uid) => Permission.read(Role.user(uid))),
    Permission.update(Role.user(me.$id)),
  ];

  const doc = await databases.createDocument(
    DB_ID,
    COLLECTIONS.audios,
    ID.unique(),
    {
      contract_id: contractId,
      question_index: questionIndex,
      file_id: fileId,
      duration_seconds: Math.round(durationMs / 1000),
      file_hash: fileHash,
      recorded_by: me.$id,
    },
    docPermissions
  );

  return doc.$id;
}

export async function deleteAudioWithFile(audioDocId: string, fileId: string): Promise<void> {
  try {
    await storage.deleteFile(BUCKETS.files, fileId);
  } catch {}
  await databases.deleteDocument(DB_ID, COLLECTIONS.audios, audioDocId);
}

export async function uploadDocument(
  uri: string,
  filename: string,
  mimeType: string,
  partyUserIds: string[]
): Promise<string> {
  const safeName = `doc-${Date.now()}-${filename}`;
  const { fileId } = await uploadFile(uri, safeName, mimeType, partyUserIds);
  return fileId;
}
