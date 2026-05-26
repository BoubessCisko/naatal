# APPWRITE.md — Configuration complète Naatal

> Ce fichier est la référence exacte pour tout ce qui touche Appwrite.
> Claude doit lire ce fichier avant de coder quoi que ce soit lié au backend.

---

## 1. Configuration initiale

```typescript
// lib/appwrite.ts
import {
  Client, Account, Databases, Storage, Functions,
  ID, Query, Permission, Role,
} from 'react-native-appwrite';

export const client = new Client()
  .setEndpoint(process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!)
  .setPlatform('com.naatal.app');

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export const functions = new Functions(client);

export const DB_ID = 'naatal';
export const COLLECTIONS = {
  users: 'users',
  contracts: 'contracts',
  parties: 'contract_parties',
  audios: 'audio_files',
  audit: 'audit_log',
} as const;
export const BUCKETS = {
  audios: 'audios',
  cniPhotos: 'cni-photos',
} as const;

export { ID, Query, Permission, Role };
```

---

## 2. Schéma — Collections (équivalent des tables Supabase)

La config déclarative complète est dans `appwrite/appwrite.json`. Déployable via :
```bash
appwrite push collections && appwrite push buckets
```

### users
Profil métier (le compte Auth est séparé, on stocke le `$id` du compte Auth comme `$id` du doc).

| Attribut       | Type     | Required | Notes                           |
|---|---|---|---|
| phone          | string   | ✅       | unique index, format +221xxx    |
| full_name      | string   | ❌       | max 120                         |
| nin_hash       | string   | ❌       | unique index, SHA-256 salté     |
| cni_photo_id   | string   | ❌       | $id du fichier dans bucket cni-photos |
| cni_verified   | boolean  | ❌       | default false                   |

### contracts
| Attribut       | Type     | Required | Notes                           |
|---|---|---|---|
| reference      | string   | ✅       | unique, format NTL-YYYY-MMDD-XXXX |
| type           | enum     | ✅       | vente/pret/service/location     |
| status         | enum     | ❌       | draft/pending/active/locked     |
| amount         | double   | ❌       |                                 |
| currency       | string   | ❌       | default FCFA                    |
| due_date       | datetime | ❌       |                                 |
| summary        | string   | ❌       | JSON stringifié, max 8KB        |
| integrity_hash | string   | ❌       | SHA-256 immuable après lock     |
| created_by     | string   | ✅       | user $id                        |
| locked_at      | datetime | ❌       |                                 |

### contract_parties
| Attribut      | Type     | Required | Notes                       |
|---|---|---|---|
| contract_id   | string   | ✅       | indexed                      |
| user_id       | string   | ✅       | indexed                      |
| role          | enum     | ✅       | initiateur/partie/temoin     |
| has_validated | boolean  | ❌       | default false                |
| validated_at  | datetime | ❌       |                              |
| otp_verified  | boolean  | ❌       | default false                |

Index unique composé `(contract_id, user_id)` pour empêcher les doublons.

### audio_files
| Attribut         | Type     | Required | Notes                  |
|---|---|---|---|
| contract_id      | string   | ✅       | indexed                |
| question_index   | integer  | ✅       | 0-99                   |
| file_id          | string   | ✅       | $id Appwrite Storage   |
| duration_seconds | integer  | ❌       |                        |
| file_hash        | string   | ✅       | SHA-256 du fichier     |

### audit_log
Collection avec **`$permissions: []`** au niveau collection → **personne ne peut écrire côté client**. Seules les Functions avec API key peuvent insérer.

| Attribut    | Type     | Required | Notes                  |
|---|---|---|---|
| contract_id | string   | ❌       | indexed                |
| user_id     | string   | ❌       |                        |
| action      | string   | ✅       | event name             |
| metadata    | string   | ❌       | JSON stringifié        |

---

## 3. Permissions — Remplacement de RLS

Appwrite n'a pas de RLS Postgres. Chaque document porte ses propres `$permissions`.

### Pattern à appliquer systématiquement

```typescript
import { Permission, Role, ID } from 'react-native-appwrite';

// Création du profil user — seul le user voit/modifie son profil
await databases.createDocument(DB_ID, COLLECTIONS.users, userId, data, [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
]);

// Création d'un contrat — seul l'initiateur peut modifier au départ
const contract = await databases.createDocument(
  DB_ID, COLLECTIONS.contracts, ID.unique(),
  { reference, type, created_by: userId, ... },
  [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
  ]
);

// Quand on ajoute une partie, on UPDATE les permissions du contrat
// pour inclure le read du nouveau user :
await databases.updateDocument(DB_ID, COLLECTIONS.contracts, contract.$id, {}, [
  Permission.read(Role.user(initiateurId)),
  Permission.read(Role.user(partyId)),       // ← ajouté
  Permission.update(Role.user(initiateurId)),
]);
```

### Lock immuable

La Function `lockContract` (API key) réécrit les permissions du document pour retirer tout `update` :

```typescript
await databases.updateDocument(DB_ID, COLLECTIONS.contracts, contractId, {
  status: 'locked',
  integrity_hash: hash,
  locked_at: new Date().toISOString(),
}, [
  Permission.read(Role.user(initiateurId)),
  Permission.read(Role.user(partyId)),
  // PAS de Permission.update → le document est figé
]);
```

### Audit log immuable

Collection-level `$permissions: []` → aucun client ne peut insérer/update/delete. Seules les Functions avec API key écrivent (la clé bypass les permissions).

---

## 4. Storage — Bucket unique `files`

Défini dans `appwrite.config.json` à la racine projet. **Free tier Appwrite Cloud = 1 bucket max** → audios et photos CNI cohabitent dans le même bucket `files`. La sécurité reste différenciée **par-fichier** via les permissions.

- **`files`** — privé, `fileSecurity: true`, max 10 MB, extensions `m4a/mp4/wav/mp3/aac/jpg/jpeg/png/webp`, `encryption: true`

### Upload audio

```typescript
import { ID, Permission, Role } from 'react-native-appwrite';
import { storage, BUCKETS } from '@/lib/appwrite';

const file = {
  uri: audioUri,        // file:// URI local
  name: `${contractId}-q${index}.m4a`,
  type: 'audio/m4a',
  size: fileSize,
};

const uploaded = await storage.createFile(
  BUCKETS.files,
  ID.unique(),
  file,
  // Permissions : read pour toutes les parties du contrat
  parties.map(p => Permission.read(Role.user(p.user_id)))
);

// Stocker uploaded.$id dans audio_files.file_id
```

### Upload photo CNI

```typescript
// Même bucket, mais permissions plus restrictives : read uniquement par le propriétaire.
const uploaded = await storage.createFile(
  BUCKETS.files,
  ID.unique(),
  { uri, name: `cni-${userId}.jpg`, type: 'image/jpeg', size },
  [Permission.read(Role.user(userId))]   // ← AUCUNE autre permission
);
// Stocker uploaded.$id dans users.cni_photo_id
```

**Pourquoi un seul bucket marche** : Appwrite vérifie les permissions au niveau fichier (`fileSecurity: true`). Un fichier audio avec `Permission.read(Role.user(A))` + `Permission.read(Role.user(B))` n'est lisible que par A et B. Un fichier photo CNI avec `Permission.read(Role.user(C))` n'est lisible que par C. Aucun risque de fuite croisée même dans le même bucket.

---

## 5. Auth — Flow OTP SMS

```typescript
import { account, ID } from '@/lib/appwrite';

// 1. Envoyer OTP (Appwrite gère Twilio en interne via le Provider configuré)
const token = await account.createPhoneToken(
  ID.unique(),       // userId — Appwrite crée le user si nouveau
  '+221XXXXXXXXX'    // toujours avec indicatif
);
// → token.userId est à conserver pour la vérification

// 2. Vérifier OTP
const session = await account.createSession(token.userId, '123456');
// → session est créée, l'utilisateur est connecté

// 3. Récupérer l'utilisateur connecté
const user = await account.get();

// 4. Logout
await account.deleteSession('current');
```

### Détecter si KYC requis après login

```typescript
const user = await account.get();
try {
  const profile = await databases.getDocument(DB_ID, COLLECTIONS.users, user.$id);
  if (!profile.cni_verified) router.replace('/(auth)/kyc');
  else router.replace('/(tabs)');
} catch {
  // 404 = pas de profil encore → créer le doc et rediriger vers KYC
  await databases.createDocument(DB_ID, COLLECTIONS.users, user.$id,
    { phone: user.phone, cni_verified: false },
    [Permission.read(Role.user(user.$id)), Permission.update(Role.user(user.$id))]
  );
  router.replace('/(auth)/kyc');
}
```

---

## 6. Helpers Appwrite côté client (Phase 1+)

```typescript
// lib/contracts.ts — exemple de helpers à créer plus tard

// Lister mes contrats — Appwrite renvoie ce sur quoi j'ai des permissions
export async function getMyContracts() {
  const res = await databases.listDocuments(
    DB_ID, COLLECTIONS.contracts,
    [Query.orderDesc('$createdAt'), Query.limit(50)]
  );
  return res.documents;
}

// Créer un contrat
export async function createContract(type: ContractType) {
  const user = await account.get();
  const ref = `NTL-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;

  const contract = await databases.createDocument(
    DB_ID, COLLECTIONS.contracts, ID.unique(),
    { reference: ref, type, status: 'draft', created_by: user.$id },
    [Permission.read(Role.user(user.$id)), Permission.update(Role.user(user.$id))]
  );

  // Ajouter l'initiateur comme partie
  await databases.createDocument(
    DB_ID, COLLECTIONS.parties, ID.unique(),
    { contract_id: contract.$id, user_id: user.$id, role: 'initiateur' },
    [Permission.read(Role.user(user.$id)), Permission.update(Role.user(user.$id))]
  );

  return contract;
}
```

---

## 7. Functions (Edge Functions équivalent)

À créer dans `appwrite/functions/<name>/` quand on en a besoin (pas Phase 0).

### hash-nin (Node 22)
- Env var : `NIN_HASH_SALT`, `APPWRITE_API_KEY`
- Reçoit `{ nin, userId }` du client
- Hash SHA-256(nin + salt), vérifie unicité, met à jour `users.nin_hash`
- Appwrite injecte un SDK serveur via `req.headers['x-appwrite-key']`

### lock-contract (Node 22)
- Env var : `APPWRITE_API_KEY`
- Vérifie OTP de toutes les parties
- Calcule integrity hash du dossier complet
- Update contract avec status=locked + retire les permissions update
- Insert dans audit_log

Squelette type :
```typescript
import { Client, Databases } from 'node-appwrite';
export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');
  // ... logique
  return res.json({ success: true });
};
```

---

## 8. Règles absolues Appwrite — NE JAMAIS VIOLER

1. **API key** → uniquement dans les Functions (env var), jamais dans le code client
2. **`documentSecurity: true`** → toujours activé sur les collections (sinon les permissions document sont ignorées)
3. **Audit log** → collection-level `$permissions: []`, insert uniquement via Function avec API key
4. **Contrat locked** → retirer le `Permission.update` du document, pas de logique app
5. **Bucket `files`** → `fileSecurity: true`, JAMAIS de fichier sans `Permission.read` explicite. Pour photo CNI : UNIQUEMENT `Permission.read(Role.user(ownerId))` — ne jamais ajouter d'autres users
6. **NIN hash** → toujours via Function `hash-nin` — jamais hasher côté client (le salt est secret)
7. **Erreurs Appwrite** → toujours afficher un message français à l'utilisateur, jamais le message technique brut. Codes utiles : 401 (pas auth), 404 (doc inexistant), 409 (unique violation)
