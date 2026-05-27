# PROGRESS.md — État d'avancement Naatal

> Ce fichier est mis à jour après chaque session de développement.
> C'est la source de vérité sur où en est le projet.

---

## 📊 Vue d'ensemble

```
Phase 0 — Setup           ██████████ 100%
Phase 1 — Auth + KYC      ██████████ 100%  (welcome, login, OTP, KYC, auth store — testée sur Android)
Phase 2 — Audio           ██████████ 100%  (hook, recorder, player, upload, Realtime sync)
Phase 3 — Contrat         ██████████ 100%  (type, participants, invite, voice multi-device, summary, documents, payment)
Phase 4 — Dossier final   ██████████ 100%  (OTP validation, lock-contract Function, hash, PDF, QR, contract detail)
Phase 5 — Tests terrain   ░░░░░░░░░░  0%   (à faire : test 2 téléphones, 3G, terrain)

TOTAL MVP                 █████████░ 90%   (code terminé — reste tests + déploiement Appwrite)
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

### 27 mai 2026 — Phases 2, 3, 4 complètes + refonte multi-device

**Phase 2 — Audio** :
- ✅ `hooks/useAudioRecorder.ts` (expo-audio, 120s max, auto-stop, loading state)
- ✅ `components/AudioRecorder.tsx` (pulse animation, timer, re-record)
- ✅ `components/AudioPlayer.tsx` (play/pause, waveform bars, progress)
- ✅ `lib/audioUpload.ts` (FileSystem.uploadAsync REST, SHA-256 hash, `recorded_by` field)
- ✅ `lib/formatTime.ts` (shared utility)
- ✅ Enregistrement testé sur Android physique — fonctionne

**Phase 3 — Contrat (architecture multi-device)** :
- ✅ `store/contractStore.ts` (Zustand — contractId, type, parties, audios, documents)
- ✅ `app/contract/new/type.tsx` (grille 2x2 : Vente, Prêt, Service, Location)
- ✅ `app/contract/new/participants.tsx` (crée le contrat + parties dans Appwrite immédiatement)
- ✅ `app/contract/new/invite.tsx` (QR code, WhatsApp, SMS — avec lien contractId)
- ✅ `app/contract/join.tsx` (party 2 rejoint, claim son slot, permissions mises à jour)
- ✅ `app/contract/[id]/voice.tsx` (chat vocal multi-device avec Appwrite Realtime)
- ✅ `app/contract/new/summary.tsx` (détails, parties, audios, documents, frais 3000 FCFA)
- ✅ `app/contract/new/documents.tsx` (upload photos/documents, caméra + galerie)
- ✅ `app/contract/new/payment.tsx` (initiateur uniquement, Wave/OM, active le contrat)
- ✅ `app/(tabs)/index.tsx` (liste contrats Appwrite, FAB, pull-to-refresh, erreur state)
- ✅ Questions guidées par rôle (Prêteur/Emprunteur, Vendeur/Acheteur, etc.)

**Phase 4 — Validation + dossier final** :
- ✅ `app/contract/validate.tsx` (OTP par partie, marque has_validated, auto-active si tous validés)
- ✅ `app/contract/[id]/index.tsx` (détail contrat, QR code, hash, PDF, lock, actions par rôle)
- ✅ `lib/hash.ts` (SHA-256 integrity hash : contract + parties + audio hashes + timestamp)
- ✅ `lib/pdf.ts` (HTML template → expo-print, watermark Naatal, partage expo-sharing)
- ✅ `appwrite/functions/lock-contract/` (Function Node — retire Permission.update, écrit audit log)

**Refonte multi-device** :
- ✅ Chaque partie sur son propre téléphone, son propre compte
- ✅ Appwrite Realtime synchronise le chat vocal entre les deux appareils
- ✅ `recorded_by` field dans audio_files — attribution fiable par userId
- ✅ Permissions : les deux parties lisent, seul l'auteur peut modifier son propre audio
- ✅ Re-enregistrement possible sur la question courante uniquement (questions passées = verrouillées)
- ✅ Suppression Storage + doc lors du re-enregistrement (pas de fichiers orphelins)
- ✅ URLs audio authentifiées par JWT
- ✅ Cleanup Realtime subscriptions safe (cancelled flag, mountedRef)

**Code review effectuée — 12 bugs corrigés** :
- buildAudioMap utilisait $permissions (cassé) → utilise recorded_by
- audio_files permission read uniquement pour l'uploadeur → les deux parties
- Hash base64 chunked cassé → lecture complète (max 10MB acceptable)
- Fichiers Storage orphelins lors du re-record → deleteAudioWithFile()
- handleNextQuestion catch vide → Alert erreur + guard optimistic locking
- Realtime cleanup race condition → cancelled flag
- audioUrl sans auth → JWT en query param
- handleRecordingComplete stale closure → useRef

**⏳ Reste à faire (action utilisateur)** :
1. Ajouter colonne `recorded_by` (string, required) à la collection `audio_files` dans Appwrite Console
2. Déployer la Function `lock-contract` : `appwrite push functions`
3. Tester le flow complet sur 2 téléphones Android simultanément
4. Tester sur connexion 3G
5. Tests terrain avec commerçants

---

## 🔴 Blocages actuels

*Aucun blocage — code MVP terminé, en attente de tests*

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

**Objectif :** Phase 5 — Tests sur vrais appareils + tests terrain.

**Prérequis avant de tester (action utilisateur) :**
1. Ajouter colonne `recorded_by` (string, required) à `audio_files` dans Appwrite Console
2. Déployer Function `lock-contract` via `appwrite push functions`
3. (Optionnel) Configurer Twilio pour OTP réel

**Plan de test :**
1. Test flow complet A→Z sur 1 Android (mode dev OTP)
2. Test multi-device : 2 téléphones, Realtime sync du chat vocal
3. Test sur connexion 3G lente
4. Test re-enregistrement + verrouillage questions
5. Test PDF + partage
6. Tests terrain avec 5-10 commerçants

**Message à donner à Claude au début de la prochaine session :**
```
Lis contexe/PROGRESS.md. Code MVP terminé (Phases 0-4).
On passe aux tests Phase 5. Problèmes trouvés : [décrire].
```

---

## 📝 Notes et observations

*Espace libre pour noter les observations terrain, idées, feedback utilisateurs*

---
*Dernière mise à jour : 27 mai 2026*

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

### 📱 Metro — Bundling qui freeze sur Windows

```
27 mai 2026 — Metro freeze à 56-99% sur Windows
Problème : Metro hang indéfiniment à un pourcentage variable (56%, 87%, 88%, 92%, 99%).
  L'app ne se charge jamais dans Expo Go.
Cause racine : combinaison de 3 facteurs sur Windows :
  1. Metro lance trop de workers en parallèle → saturation I/O NTFS
  2. Metro scanne des dossiers inutiles (appwrite/functions/, contexe/)
  3. @expo/vector-icons importé via barrel export charge tout le registre d'icônes
Solutions appliquées (les 3 ensemble) :
  1. metro.config.js → maxWorkers: 1 (évite la contention I/O Windows)
  2. metro.config.js → blockList: [/appwrite\/functions\/.*/, /contexe\/.*/]
  3. import Ionicons from '@expo/vector-icons/Ionicons' (PAS { Ionicons } from '@expo/vector-icons')
Si ça hang encore : npx expo start --clear --no-dev
Temps perdu si pas su : 2h+ de redémarrages à l'aveugle.
```

```
27 mai 2026 — Appwrite Realtime crash "Cannot read property 'getItem' of undefined"
Problème : le SDK Appwrite utilise window.localStorage pour les cookies de session.
  React Native n'a pas de window.localStorage → crash au premier événement Realtime.
Solution : polyfill dans lib/appwrite.ts — objet en mémoire + sync AsyncStorage.
  Le setItem persiste vers AsyncStorage, le getItem lit le cache mémoire.
  cookieReady (Promise) hydrate le cache au démarrage — toujours l'attendre
  avant d'appeler account.get() ou killExistingSession().
```

```
27 mai 2026 — Sessions anonymes Appwrite = mauvaise architecture pour phone auth
Problème : createAnonymousSession() crée un NOUVEL utilisateur Appwrite à chaque appel.
  Même numéro de téléphone → nouvel userId → conflit unique index sur phone →
  "Document with requested ID already exists".
  Pas patchable : le modèle anonymous session ≠ phone-based identity.
Cause racine : le mode dev utilisait des sessions anonymes au lieu du vrai flow phone auth.
Solution : utiliser account.createPhoneToken() + account.createSession() dans TOUS les cas.
  En dev sans Twilio : appeler l'API REST Appwrite avec l'API key pour créer
  l'utilisateur + token côté serveur (devAuth dans lib/auth.ts).
  En prod : Twilio envoie le SMS.
  JAMAIS de createAnonymousSession().
```

---

### 📱 UI — NativeWind v4

*Aucune leçon encore*

---

### 🧭 Navigation — Expo Router v5

```
27 mai 2026 — Auth guard bloque les routes contract/*
Problème : le guard dans _layout.tsx redirige vers /(tabs) si l'utilisateur
  n'est pas dans (tabs) ou (auth). Résultat : naviguer vers /contract/new/voice
  fait un flash puis retour immédiat au home.
Solution : ajouter seg[0] === 'contract' dans la condition inAppScreen.
  const inAppScreen = inTabsGroup || seg[0] === 'contract';
```

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
