# Appwrite — Setup Naatal

Backend Naatal sur **Appwrite Cloud** (https://cloud.appwrite.io).
La config déclarative est dans `appwrite.config.json` **à la racine du projet** (convention CLI v21+). Ce dossier-ci contient uniquement les Functions et ce README.

---

## 1. Créer le projet

1. Compte gratuit sur https://cloud.appwrite.io (compte global, login = endpoint générique `cloud.appwrite.io`)
2. **Create project** → Name: `Naatal` → Region: `Frankfurt (EU)` (RGPD + latence acceptable pour Sénégal)
3. Note le `Project ID` (Overview → Project ID)
4. **Settings** → **Platforms** → **Add Platform** → **React Native** : Name `Naatal Android`, Package name `com.naatal.app`

---

## 2. Configurer `.env.local`

À la racine du projet (`c:\projetcs\naatal\.env.local`) :

```env
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=ton-project-id

# Pour la CLI de déploiement (PAS bundlé dans l'app — pas de préfixe EXPO_PUBLIC_)
APPWRITE_API_KEY=ta-api-key
```

L'endpoint régional dépend de la région du projet : `fra.*`, `nyc.*`, `syd.*` etc. Le **login** CLI utilise l'endpoint générique `https://cloud.appwrite.io/v1`, pas le régional.

---

## 3. Créer une API Key (pour la CLI)

⚠️ **Pas une "dev key"** — les dev keys ne donnent que le bypass rate-limit, sans aucune permission admin. Pour push depuis la CLI il faut une **API Key**.

1. Console → ton projet → **Overview** → **Integrations** → onglet **API keys** → **Create API Key**
2. Name : `cli-deploy` | Expiration : 30 jours
3. Scopes : tous ceux liés à databases/tables/columns/indexes/documents/buckets/files (ou "Select all" pour aller vite en dev)
4. Copie la clé immédiatement → colle dans `.env.local` à la ligne `APPWRITE_API_KEY=`

---

## 4. Déployer la config

```powershell
# 1. Charge la clé depuis .env.local (jamais visible en ligne de commande)
$env:APPWRITE_API_KEY = (Select-String -Path c:\projetcs\naatal\.env.local -Pattern "^APPWRITE_API_KEY=").Line.Split("=",2)[1].Trim()

# 2. Configure la CLI (une fois — stocké dans ~/.appwrite/prefs.json)
appwrite client --endpoint https://fra.cloud.appwrite.io/v1 --project-id TON_PROJECT_ID --key $env:APPWRITE_API_KEY

# 3. Push depuis la racine projet (PAS depuis appwrite/)
cd c:\projetcs\naatal
appwrite push tables --all --force      # crée database + 5 tables + colonnes + indexes
appwrite push buckets --all --force     # crée le bucket `files`
```

**Important** : la CLI v21 a renommé :
- `collections` → `tables` (et `push collections` est déprécié)
- `attributes` → `columns`
- `documentSecurity` → `rowSecurity`
- Config par défaut : `appwrite.config.json` (à la racine) — pas `appwrite.json` dans un sous-dossier

---

## 5. Activer Phone Auth (Twilio)

1. Compte Twilio (https://twilio.com) → Account SID + Auth Token + numéro émetteur
2. Console Appwrite → **Messaging** → **Providers** → **Add Provider** → **SMS** → **Twilio** — renseigner SID, Token, From number
3. **Auth** → **Settings** → **Phone (SMS)** → enable, sélectionner le provider Twilio
4. (Dev) ajouter des **mockNumbers** pour tester sans consommer de SMS

---

## 6. Storage — bucket unique `files` (limite free tier)

**Free tier Appwrite = 1 seul bucket.** On a consolidé `audios` + `cni-photos` en un seul `files` qui accepte les deux types de fichiers.

| Bucket | Max | Extensions | Sécurité |
|---|---|---|---|
| `files` | 10 MB | m4a, mp4, wav, mp3, aac, jpg, jpeg, png, webp | `fileSecurity: true` |

La séparation audios vs photos CNI se fait **par les permissions de chaque fichier** :
- Audio : `Permission.read(Role.user(partie1))`, `Permission.read(Role.user(partie2))` — toutes les parties du contrat voient
- Photo CNI : `Permission.read(Role.user(owner))` UNIQUEMENT — personne d'autre

Voir [contexe/APPWRITE.md](../contexe/APPWRITE.md) section 4 pour les snippets d'upload.

---

## 7. Permissions — comment ça remplace RLS

Appwrite n'a pas de RLS Postgres. Chaque document (et chaque fichier) porte ses `$permissions`. À chaque `createDocument`/`createFile`, **passer le 4e argument explicitement** :

```typescript
import { Permission, Role } from 'react-native-appwrite';

await databases.createDocument(DB_ID, COLLECTIONS.users, userId, data, [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
]);
```

Quand on ajoute une partie à un contrat → `updateDocument` du contrat avec un tableau complet de permissions incluant la nouvelle partie.

Pour rendre un contrat immuable (`lockContract` Function) → réécrire les `$permissions` SANS aucun `Permission.update`. Plus de trigger SQL, plus de tour de contrôle, c'est par-document.

---

## 8. Functions (Phase ultérieure, pas Phase 0)

Squelettes à créer dans `appwrite/functions/<name>/` quand on en a besoin :
- **`hash-nin`** (Node 22) — env `NIN_HASH_SALT`, hash SHA-256 + check unicité, met à jour `users.nin_hash`
- **`lock-contract`** (Node 22) — vérifie OTP de toutes les parties, calcule integrity_hash, retire `Permission.update` du contrat, insert audit_log

---

## 9. Régénérer la config après modif

Pas de génération auto. Si tu changes `appwrite.config.json`, mets à jour à la main :
- `lib/appwrite.ts` (IDs si ajout d'une table/bucket)
- `types/appwrite.ts` (types `*Doc`)
- `appwrite push tables --all --force` (ne supprime que ce qui n'existe plus dans la config, sinon update incrementally)
