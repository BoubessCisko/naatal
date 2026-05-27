import * as FileSystem from 'expo-file-system/legacy';
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

// Save audio metadata to Appwrite WITHOUT uploading the file.
// The local URI is stored so the recording party can play it back.
// The file_id stays empty until batch upload at payment.
export async function saveAudioMetadata(params: {
  localUri: string;
  contractId: string;
  questionIndex: number;
  durationMs: number;
  partyUserIds: string[];
}): Promise<string> {
  const { localUri, contractId, questionIndex, durationMs, partyUserIds } = params;
  const me = await account.get();

  const doc = await databases.createDocument(
    DB_ID,
    COLLECTIONS.audios,
    ID.unique(),
    {
      contract_id: contractId,
      question_index: questionIndex,
      file_id: '',
      duration_seconds: Math.round(durationMs / 1000),
      file_hash: '',
      recorded_by: me.$id,
    },
    [
      ...partyUserIds.map((uid) => Permission.read(Role.user(uid))),
      Permission.update(Role.user(me.$id)),
    ]
  );

  // Store local URI in documentDirectory for persistence across reloads
  const localCopy = `${FileSystem.documentDirectory}audio-${doc.$id}.m4a`;
  try {
    await FileSystem.copyAsync({ from: localUri, to: localCopy });
  } catch {
    // If copy fails, keep original URI
  }

  return doc.$id;
}

// Batch upload all audios for a contract. Called at payment/finalization.
// Reads files from documentDirectory (where they were copied during recording).
export async function batchUploadAudios(
  contractId: string,
  partyUserIds: string[]
): Promise<number> {
  const me = await account.get();
  const jwt = await account.createJWT();
  const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!;
  const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;

  // Get all audio docs for this contract that haven't been uploaded yet
  const res = await databases.listDocuments(DB_ID, COLLECTIONS.audios, [
    `equal("contract_id", "${contractId}")`,
    `equal("file_id", "")`,
  ]);

  let uploaded = 0;

  for (const doc of res.documents) {
    const localPath = `${FileSystem.documentDirectory}audio-${doc.$id}.m4a`;
    const info = await FileSystem.getInfoAsync(localPath);
    if (!info.exists) continue;

    try {
      const fileId = ID.unique();
      const url = `${endpoint}/storage/buckets/${BUCKETS.files}/files`;

      const result = await FileSystem.uploadAsync(url, localPath, {
        httpMethod: 'POST',
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: 'file',
        mimeType: 'audio/mp4',
        parameters: { fileId },
        headers: {
          'X-Appwrite-Project': projectId,
          'X-Appwrite-JWT': jwt.jwt,
        },
      });

      if (result.status >= 200 && result.status < 300) {
        const body = JSON.parse(result.body) as { $id: string };

        // Set file permissions
        await storage.updateFile({
          bucketId: BUCKETS.files,
          fileId: body.$id,
          permissions: partyUserIds.map((uid) => Permission.read(Role.user(uid))),
        });

        // Update audio doc with file_id
        await databases.updateDocument(DB_ID, COLLECTIONS.audios, doc.$id, {
          file_id: body.$id,
        });

        // Clean up local copy
        FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => {});
        uploaded++;
      }
    } catch {}
  }

  return uploaded;
}

export async function deleteAudioWithFile(audioDocId: string, fileId: string): Promise<void> {
  if (fileId) {
    try { await storage.deleteFile(BUCKETS.files, fileId); } catch {}
  }
  // Also delete local copy
  const localPath = `${FileSystem.documentDirectory}audio-${audioDocId}.m4a`;
  FileSystem.deleteAsync(localPath, { idempotent: true }).catch(() => {});
  await databases.deleteDocument(DB_ID, COLLECTIONS.audios, audioDocId);
}

export async function uploadDocument(
  uri: string,
  filename: string,
  mimeType: string,
  partyUserIds: string[]
): Promise<string> {
  const jwt = await account.createJWT();
  const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!;
  const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;
  const fileId = ID.unique();

  const result = await FileSystem.uploadAsync(
    `${endpoint}/storage/buckets/${BUCKETS.files}/files`,
    uri,
    {
      httpMethod: 'POST',
      uploadType: FileSystem.FileSystemUploadType.MULTIPART,
      fieldName: 'file',
      mimeType,
      parameters: { fileId },
      headers: {
        'X-Appwrite-Project': projectId,
        'X-Appwrite-JWT': jwt.jwt,
      },
    }
  );

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload document échoué (${result.status})`);
  }

  const body = JSON.parse(result.body) as { $id: string };

  await storage.updateFile({
    bucketId: BUCKETS.files,
    fileId: body.$id,
    permissions: partyUserIds.map((uid) => Permission.read(Role.user(uid))),
  });

  return body.$id;
}
