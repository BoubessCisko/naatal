import { ExecutionMethod } from 'react-native-appwrite';
import {
  account,
  databases,
  functions,
  ID,
  Permission,
  Role,
  DB_ID,
  COLLECTIONS,
  cookieReady,
} from './appwrite';

const USE_REAL_OTP = process.env.EXPO_PUBLIC_USE_REAL_OTP === 'true';

export type SendOtpResult = { userId: string; phone: string; secret?: string };

async function killExistingSession(): Promise<void> {
  await cookieReady;
  try {
    await account.deleteSession('current');
    return;
  } catch {}
  try {
    const sessions = await account.listSessions();
    for (const s of sessions.sessions) {
      await account.deleteSession(s.$id).catch(() => {});
    }
  } catch {}
}

// Dev auth: calls Appwrite REST API directly with API key to create
// user + token without SMS. Only works when APPWRITE_API_KEY is set.
async function devAuth(phone: string): Promise<{ userId: string; secret: string }> {
  const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!;
  const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!;
  const apiKey = process.env.EXPO_PUBLIC_DEV_API_KEY ?? '';
  const headers = {
    'Content-Type': 'application/json',
    'X-Appwrite-Project': projectId,
    'X-Appwrite-Key': apiKey,
  };

  let userId: string;

  // Try to create user. If phone already exists (409), find them instead.
  const createRes = await fetch(`${endpoint}/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ userId: ID.unique(), phone }),
  });

  if (createRes.ok) {
    const data = await createRes.json();
    userId = data.$id;
  } else if (createRes.status === 409) {
    // User exists — search by phone
    const searchRes = await fetch(
      `${endpoint}/users?search=${encodeURIComponent(phone)}`,
      { headers }
    );
    const searchData = await searchRes.json();
    const match = searchData.users?.find((u: any) => u.phone === phone);
    if (!match) throw new Error('Utilisateur introuvable.');
    userId = match.$id;
  } else {
    const err = await createRes.json();
    throw new Error(err.message ?? 'Erreur authentification.');
  }

  // Create a token — no SMS, server-side only
  const tokenRes = await fetch(`${endpoint}/users/${userId}/tokens`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ length: 6, expire: 300 }),
  });
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok) throw new Error(tokenData.message ?? 'Création token échouée');

  return { userId: tokenData.userId, secret: tokenData.secret };
}

export async function sendOtp(phone: string): Promise<SendOtpResult> {
  await killExistingSession();

  if (USE_REAL_OTP) {
    const token = await account.createPhoneToken(ID.unique(), phone);
    return { userId: token.userId, phone };
  }

  const { userId, secret } = await devAuth(phone);
  return { userId, phone, secret };
}

export async function verifyOtp(
  userId: string,
  code: string,
  phone: string,
  devSecret?: string
): Promise<void> {
  const secret = devSecret ?? code;
  await account.createSession(userId, secret);

  const me = await account.get();
  try {
    await databases.getDocument(DB_ID, COLLECTIONS.users, me.$id);
  } catch (err: any) {
    if (err?.code === 404 || err?.type === 'document_not_found') {
      await databases.createDocument(
        DB_ID,
        COLLECTIONS.users,
        me.$id,
        { phone, cni_verified: false },
        [
          Permission.read(Role.user(me.$id)),
          Permission.update(Role.user(me.$id)),
        ]
      );
    }
  }
}

export async function logout(): Promise<void> {
  await killExistingSession();
}
