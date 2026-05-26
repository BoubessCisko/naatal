# PROGRESS.md — État d'avancement Naatal

> Ce fichier est mis à jour après chaque session de développement.
> C'est la source de vérité sur où en est le projet.

---

## 📊 Vue d'ensemble

```
Phase 0 — Setup           ██████████ 100%  (app testée Expo Go Android — manque juste Phone Auth + Twilio)
Phase 1 — Auth + KYC      ░░░░░░░░░░  0%
Phase 2 — Audio           ░░░░░░░░░░  0%
Phase 3 — Contrat         ░░░░░░░░░░  0%
Phase 4 — Dossier final   ░░░░░░░░░░  0%
Phase 5 — Tests terrain   ░░░░░░░░░░  0%

TOTAL MVP                 █░░░░░░░░░ 15%
```

---

## 📅 Journal de développement

### 24 mai 2026 — Initialisation
- ✅ Documents de contexte créés (CLAUDE.md, DESIGN.md, WORKFLOW.md, PRD.md, TASKS.md)
- ✅ Prototype UI validé
- ⬜ Setup Expo pas encore commencé

### 26 mai 2026 — Phase 0 (Setup) + Pivot Supabase → Appwrite

**Setup initial (matin)** :
- ✅ Docs mises à jour SDK 54 → SDK 56 (CLAUDE.md, WORKFLOW.md, TASKS.md, PROGRESS.md)
- ✅ Packages installés : expo-router, react-native-screens, safe-area-context, gesture-handler, reanimated 4 + worklets, linking, constants, font, async-storage, nativewind v4, tailwind 3.4, zustand, crypto-js, @expo-google-fonts/plus-jakarta-sans
- ✅ Structure flat créée : app/ components/ lib/ store/ types/ constants/ hooks/
- ✅ `constants/colors.ts` (palette Naatal) + `constants/questions.ts` (4 types de contrat)
- ✅ `.env.local.example` + `.gitignore` durci
- ✅ `app.json` remplacé par `app.config.ts` (typedRoutes, scheme `naatal`, permissions iOS/Android, bundleIds)
- ✅ Migration `App.tsx`/`index.ts` → Expo Router (`app/_layout.tsx` + `app/index.tsx`), main = `expo-router/entry`
- ✅ NativeWind v4 configuré : `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css`, `nativewind-env.d.ts`, `tsconfig.json` (jsxImportSource + path alias `@/*`)
- ✅ `.npmrc` avec `legacy-peer-deps=true` (workaround conflit react-dom 19.2.6 vs react 19.2.3)

**Pivot Appwrite (après-midi)** :
- ✅ Désinstallé `@supabase/supabase-js` + `react-native-url-polyfill`
- ✅ Installé `react-native-appwrite`
- ✅ Supprimé `lib/supabase.ts`, `types/supabase.ts`, dossier `supabase/migrations/` (9 fichiers SQL)
- ✅ Créé `lib/appwrite.ts` (Client + Account + Databases + Storage + Functions + IDs centralisés)
- ✅ Créé `types/appwrite.ts` (types `*Doc` avec system fields `$id`, `$createdAt`, etc.)
- ✅ Simplifié `types/index.ts` (enums + re-export des doc types)
- ✅ Créé `appwrite/appwrite.json` (5 collections + 2 buckets + indexes + permissions, déployable via CLI)
- ✅ Créé `appwrite/README.md` (guide setup pas-à-pas : projet, plateforme RN, env, deploy, Phone Auth Twilio, permissions pattern)
- ✅ `contexe/SUPABASE.md` → `contexe/APPWRITE.md` (réécrit : config, schéma, permissions = RLS-like, Storage, Auth OTP, helpers, Functions, règles absolues)
- ✅ MAJ `contexe/CLAUDE.md` (stack, schéma, sécurité, env vars)
- ✅ MAJ `contexe/WORKFLOW.md` (commandes Appwrite CLI, snippet upload, OTP debug, packages approuvés)
- ✅ MAJ `contexe/TASKS.md` (sections 0.2, 1.2, 1.3, 1.4, 2.4, 3.3, 4.1 — toutes les références Supabase → Appwrite)
- ✅ `npx tsc --noEmit` : 0 erreur (à reverifier post-pivot)
- ✅ `npx expo-doctor` : 21/21 (à reverifier post-pivot)

**Déploiement Appwrite réalisé (même session)** :
- ✅ Projet Appwrite Cloud créé (région Frankfurt, ID `6a159b4d000f669ad1a9`)
- ✅ Plateforme React Native ajoutée (package `com.naatal.app`)
- ✅ API Key `cli-deploy` générée (PAS dev key — voir Lessons Learned), stockée dans `.env.local` (`APPWRITE_API_KEY`, sans préfixe EXPO_PUBLIC_)
- ✅ Config migrée de `appwrite/appwrite.json` (legacy) vers `appwrite.config.json` à la racine (convention CLI v21)
- ✅ Schéma migré au format v21 : `tablesDB` + `tables` + `columns` + `rowSecurity` (au lieu de databases/collections/attributes/documentSecurity)
- ✅ Database `naatal` + 5 tables (users, contracts, contract_parties, audio_files, audit_log) avec toutes leurs colonnes + indexes déployées via `appwrite push tables --all --force`
- ✅ Bucket unique `files` créé (free tier = 1 bucket max → consolidation audios + photos CNI dans un seul bucket, séparation par-fichier via permissions)
- ✅ `lib/appwrite.ts` mis à jour : `BUCKETS = { files: 'files' }`
- ✅ Docs mises à jour : APPWRITE.md (section 4 storage), CLAUDE.md (schéma), WORKFLOW.md (snippet), TASKS.md, `appwrite/README.md` (procédure complète)

**⏳ Reste à faire pour clôturer Phase 0 (action utilisateur)** :
1. Activer Phone Auth dans Console Appwrite → Auth → Settings → Phone (SMS)
2. Configurer Twilio dans Messaging → Providers → SMS (Account SID + Auth Token + numéro émetteur)
3. (Optionnel dev) ajouter des mockNumbers pour tester l'OTP sans consommer de SMS
4. Lancer `npx expo start` → scanner QR dans Expo Go Android → écran "Setup Phase 0 OK" doit s'afficher

---

## 🔴 Blocages actuels

*Aucun blocage pour le moment — projet non démarré*

---

## ⚠️ Décisions techniques prises

| Date | Décision | Raison |
|---|---|---|
| 24 mai 2026 | Expo SDK 56 (pas PWA) | Accès micro natif indispensable. Initialement prévu SDK 54, mis à jour SDK 56 (template create-expo-app actuel) le 26 mai. |
| 26 mai 2026 | expo-audio pour l'audio | expo-av supprimé depuis SDK 53. expo-audio est le remplacement officiel (hooks `useAudioRecorder`, `useAudioPlayer`). |
| 26 mai 2026 | expo-print pour PDF | react-native-html-to-pdf incompatible managed workflow. expo-print rend le HTML en PDF natif. |
| ~~24 mai 2026~~ | ~~Supabase~~ | **Abandonné le 26/05 — pivot Appwrite. Voir ligne suivante.** |
| 26 mai 2026 | **Appwrite Cloud (pivot depuis Supabase)** | Free tier Supabase insuffisant pour le projet. Alternatives évaluées : Firebase (NoSQL + Blaze plan obligatoire pour Functions) et Xano (no-code = incompatible philosophie Karpathy code-first). Appwrite gagne : free tier 5 GB storage + 3,5M function exec, Functions sans carte de crédit, permissions document-level proches du modèle RLS, code-first, exportable (open-source). |
| 24 mai 2026 | 3000 FCFA flat | Décision fondateur, à valider terrain |
| 24 mai 2026 | Android d'abord | iOS micro PWA problématique |
| 24 mai 2026 | Français uniquement MVP | Wolof IA pas encore fiable |

---

## 📱 Appareils de test

| Appareil | OS | Statut | Notes |
|---|---|---|---|
| *À ajouter* | | | |

---

## 🧪 Résultats tests terrain

| Date | Testeur | Profession | Blocages notés | Note /10 |
|---|---|---|---|---|
| *À venir* | | | | |

---

## 📈 Métriques (post-lancement)

| Métrique | Objectif | Actuel |
|---|---|---|
| Contrats créés | 100 (M3) | 0 |
| Taux complétion | > 60% | - |
| Temps moyen création | < 3 min | - |
| Utilisateurs actifs | 50 (M2) | 0 |

---

## 🔄 Prochaine session

**Objectif :** Phase 1 — Auth (welcome / login / OTP / KYC).

**Prérequis avant de coder Phase 1 (action utilisateur) :**
1. Projet Appwrite Cloud créé + Project ID dans `.env.local`
2. Collections + buckets déployés via `appwrite push` (ou créés manuellement)
3. Phone Auth activé + Provider Twilio configuré dans Messaging
4. `npx expo start` lance l'app, Expo Go Android affiche bien "Setup Phase 0 OK"

**Message à donner à Claude au début de la prochaine session :**
```
Lis CLAUDE.md + PROGRESS.md. On commence Phase 1 du projet Naatal (Auth + KYC).
État actuel : Phase 0 terminée, app démarre, Supabase configuré.
Cette session : welcome → login → OTP → KYC en suivant TASKS.md sections 1.1 → 1.5.
```

---

## 📝 Notes et observations

*Espace libre pour noter les observations terrain, idées, feedback utilisateurs*

---
*Dernière mise à jour : 24 mai 2026*

---

## 🧠 Lessons Learned — Mémoire permanente

> Section critique. Chaque leçon ici évite de répéter la même erreur.
> Format : date | contexte | problème | solution | à retenir pour Claude

### Comment utiliser cette section

Après chaque bug résolu ou décision importante, ajouter une entrée ici.
Au début de chaque nouvelle session Claude, dire :
```
Lis CLAUDE.md et la section Lessons Learned de PROGRESS.md avant de coder.
```
Claude ne répétera plus les mêmes erreurs.

---

### 📦 Packages et compatibilité Expo SDK 56

```
26 mai 2026 — babel-preset-expo PAS installé automatiquement (Node 26)
Problème : `npx expo start` plante avec "Cannot read properties of undefined (reading 'transformFile')"
Cause cachée (loggée mais scrollée vite) : "Failed to construct transformer: Cannot find module 'babel-preset-expo'"
Cause racine : Node 26 a une résolution de modules plus stricte. Le `babel-preset-expo` est
transitif d'`expo` mais Node 26 ne le trouve pas via le babel.config.js du projet.
Solution : `npm install --save-dev babel-preset-expo`
Temps perdu si pas su : 1h+ à débugger Metro/cache/babel.
Référence Bundler.js:33 où l'erreur est avalée silencieusement.
```

```
26 mai 2026 — expo-av supprimé en SDK 53+
Problème : Claude ou tutoriel propose `import { Audio } from 'expo-av'` → module introuvable
Solution : utiliser `expo-audio` (`useAudioRecorder`, `useAudioPlayer`, `AudioModule`)
Référence : https://docs.expo.dev/versions/latest/sdk/audio/

26 mai 2026 — expo-camera : nouvelle API
Problème : `import { Camera }` ne marche plus
Solution : toujours `import { CameraView } from 'expo-camera'`

26 mai 2026 — react-native-html-to-pdf incompatible Expo managed
Problème : nécessite native modules custom
Solution : `expo-print` (`Print.printToFileAsync({ html })`) + `expo-sharing`
```

---

### 🎤 Audio — expo-av

*Aucune leçon encore*

---

### 🗄️ Appwrite — Auth / Storage / Permissions (ex-Supabase)

```
26 mai 2026 — Pivot Supabase → Appwrite Cloud
Raison : free tier Supabase épuisé/insuffisant pour le projet.
Comparé : Firebase (NoSQL + Blaze obligatoire pour Functions = même blocage CB),
Xano (no-code, incompatible Karpathy code-first).
Choix : Appwrite Cloud (free tier 5GB storage + 3,5M function exec/mois, code-first,
permissions document-level proches de RLS, open-source exportable).
```

```
26 mai 2026 — Appwrite n'a pas de RLS — la sécurité est document-level
Problème potentiel : oublier les permissions à la création = doc invisible à son propre owner.
Solution : TOUJOURS passer un 4e arg à createDocument/createFile :
  [Permission.read(Role.user(uid)), Permission.update(Role.user(uid))]
Pour partager : updateDocument(..., {}, [Permission.read(Role.user(otherUid)), ...])
```

```
26 mai 2026 — `documentSecurity: true` obligatoire sur toutes les collections
Si false (default), les permissions document sont IGNORÉES — seules les
permissions collection s'appliquent. Naatal exige documentSecurity:true partout.
(En v21 : `rowSecurity: true`)
```

```
26 mai 2026 — Appwrite CLI v21 a renommé tout le vocabulaire data
- `databases` → `tablesDB` (au top-level de appwrite.config.json)
- `collections` → `tables`
- `attributes` → `columns`
- `documentSecurity` → `rowSecurity`
- `appwrite push collections` → `appwrite push tables` (l'ancienne est dépréciée)
- L'API CLI : `appwrite databases list` → `appwrite tables-db list`
- Index `attributes` field → `columns`
Si tu utilises l'ancien vocabulaire, la CLI accepte le JSON SILENCIEUSEMENT
(strict mode rejette mais sans erreur visible) → "No tables found".
Temps perdu si pas su : 1h+.
```

```
26 mai 2026 — Appwrite CLI v21 priorise `appwrite.config.json` à la racine PROJET
- CLI walks UP le dossier depuis cwd
- Cherche d'abord `appwrite.config.json` (nouveau format), fallback `appwrite.json` (legacy)
- Un STUB `appwrite.config.json` à la racine (auto-créé par `appwrite client`) masque
  silencieusement le vrai schéma dans un sous-dossier.
- Solution Naatal : tout consolidé dans `appwrite.config.json` à la racine.
- Le sous-dossier `appwrite/` ne contient que les Functions et le README.
```

```
26 mai 2026 — Appwrite "dev keys" ≠ "API keys" (PIÈGE MAJEUR)
- Dev keys : bypass rate-limiting client SEULEMENT, AUCUNE permission admin.
  Intended pour le SDK client en dev (éviter les 429 quand tu hot-reload).
- API keys : permissions admin selon scopes cochés. À utiliser pour la CLI et les scripts.
- Si tu donnes une dev key à `appwrite client --key X`, tous les push échouent en 401
  avec "user not authorized" — sans dire pourquoi.
- Naatal : utilise `APPWRITE_API_KEY` avec tous les scopes data (databases.*,
  tables.*, columns.*, indexes.*, documents.*, buckets.*, files.*).
```

```
26 mai 2026 — Appwrite login utilise endpoint GÉNÉRIQUE, pas régional
- `appwrite login` → toujours `https://cloud.appwrite.io/v1` (auth globale)
- Les appels projet (push, list, etc.) utilisent l'endpoint régional :
  `https://fra.cloud.appwrite.io/v1` pour Frankfurt
- Si tu fais `appwrite login --endpoint https://fra.cloud.appwrite.io/v1` :
  erreur "Cloud login uses https://cloud.appwrite.io/v1"
- Workaround Naatal : on n'utilise PAS `appwrite login` du tout. On configure
  directement `appwrite client --endpoint <regional> --project-id X --key Y` avec
  l'API key — pas besoin de session utilisateur.
```

```
26 mai 2026 — Appwrite Cloud free tier = 1 SEUL bucket
Plan initial : 2 buckets (`audios` + `cni-photos`). Push du 2ème → 402 "max buckets reached".
Solution adoptée : bucket unique `files` (m4a/mp4/wav/mp3/aac + jpg/jpeg/png/webp, 10 MB).
La séparation se fait par PERMISSIONS PAR-FICHIER :
- Audio : Permission.read pour chaque user partie du contrat
- Photo CNI : Permission.read UNIQUEMENT pour l'owner
fileSecurity:true garantit qu'aucune fuite croisée n'est possible.
```

---

### 📱 UI — NativeWind v4

*Aucune leçon encore*

---

### 🧭 Navigation — Expo Router v5

*Aucune leçon encore*

---

### 🐛 Bugs résolus — Ne jamais reproduire

| Date | Bug | Cause racine | Fix appliqué | Temps perdu |
|---|---|---|---|---|
| *À venir* | | | | |

---

### 💡 Patterns qui marchent bien

| Date | Pattern | Contexte | Pourquoi ça marche |
|---|---|---|---|
| *À venir* | | | |

---

### 🚫 Patterns à éviter absolument

| Date | Pattern évité | Raison | Alternative |
|---|---|---|---|
| *À venir* | | | |

---

### 👥 Insights terrain — Commerçants

| Date | Observation | Impact sur le produit |
|---|---|---|
| *À venir* | | |

---

## 📝 Notes libres

*Idées, feedback utilisateurs, observations non catégorisées*

---
*Dernière mise à jour : 24 mai 2026*
