import {
  account,
  databases,
  ID,
  Permission,
  Role,
  DB_ID,
  COLLECTIONS,
} from './appwrite';

// Switch dev/prod via .env.local : EXPO_PUBLIC_USE_REAL_OTP=true active Twilio.
// Par défaut (false), on bypass l'OTP réel et on crée une session anonyme Appwrite.
const USE_REAL_OTP = process.env.EXPO_PUBLIC_USE_REAL_OTP === 'true';

// Magic code accepté en mode dev. À taper sur l'écran OTP pendant le dev.
export const DEV_OTP_CODE = '123456';

export type SendOtpResult = { userId: string; phone: string };

export async function sendOtp(phone: string): Promise<SendOtpResult> {
  if (USE_REAL_OTP) {
    const token = await account.createPhoneToken(ID.unique(), phone);
    return { userId: token.userId, phone };
  }
  // Mode dev : userId factice mais déterministe (même phone → même userId)
  return { userId: `dev_${phone.replace(/\D/g, '')}`, phone };
}

export async function verifyOtp(
  userId: string,
  code: string,
  phone: string
): Promise<void> {
  // Kill any stale session before creating a new one
  try { await account.deleteSession('current'); } catch {}

  if (USE_REAL_OTP) {
    await account.createSession(userId, code);
  } else {
    if (code !== DEV_OTP_CODE) {
      throw new Error(`Code incorrect. En mode dev, utilise ${DEV_OTP_CODE}.`);
    }
    await account.createAnonymousSession();
  }

  // Crée le profil user si nouveau, sinon update le numéro
  const me = await account.get();
  try {
    await databases.getDocument(DB_ID, COLLECTIONS.users, me.$id);
  } catch {
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

export async function logout(): Promise<void> {
  try {
    await account.deleteSession('current');
  } catch {
    // déjà déconnecté — pas grave
  }
}
