import { Client, Account, Databases, Storage, Functions, Realtime, ID, Query, Permission, Role } from 'react-native-appwrite';
import { Channel } from 'react-native-appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Appwrite SDK uses window.localStorage for session cookie fallback.
// React Native has no localStorage — polyfill with in-memory cache + AsyncStorage sync.
const cookieCache: Record<string, string> = {};
let cookieHydrated = false;

export const cookieReady = AsyncStorage.getItem('cookieFallback').then((v) => {
  if (v) cookieCache['cookieFallback'] = v;
  cookieHydrated = true;
});

if (typeof window !== 'undefined' && !window.localStorage) {
  (window as any).localStorage = {
    getItem: (key: string) => cookieCache[key] ?? null,
    setItem: (key: string, value: string) => {
      cookieCache[key] = value;
      AsyncStorage.setItem(key, value).catch(() => {});
    },
    removeItem: (key: string) => {
      delete cookieCache[key];
      AsyncStorage.removeItem(key).catch(() => {});
    },
  };
}

const endpoint = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

if (!endpoint || !projectId) {
  throw new Error(
    'Variables Appwrite manquantes. Crée un .env.local depuis .env.local.example puis redémarre Expo.'
  );
}

export const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setPlatform('com.naatal.app');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

// IDs centralisés ici pour éviter les strings magiques dans le code.
// Doivent matcher l'appwrite.json à la racine du dossier appwrite/.
export const DB_ID = 'naatal';

export const COLLECTIONS = {
  users: 'users',
  contracts: 'contracts',
  parties: 'contract_parties',
  audios: 'audio_files',
  audit: 'audit_log',
} as const;

// Un seul bucket partagé (limite free tier Appwrite = 1 bucket).
// Audios et photos CNI cohabitent — la sécurité est par-fichier via Permission.read(Role.user(...)).
export const BUCKETS = {
  files: 'files',
} as const;

export const realtime = new Realtime(client);

export { ID, Query, Permission, Role, Channel };
