# CLAUDE.md — Naatal Project Context

> Ce fichier est lu par Claude à chaque session de développement.
> Il contient tout le contexte nécessaire pour coder sans jamais répéter les décisions déjà prises.

---

## 🎯 C'est quoi Naatal ?

Une application mobile (Expo) qui transforme un accord verbal en dossier de preuve numérique sécurisé.

**Problème résolu :** En Afrique de l'Ouest, les accords sont verbaux. Quand il y a un litige, il n'y a pas de preuve. Naatal crée ce dossier en moins de 2 minutes.

**Marché cible MVP :** Commerçants informels, artisans au Sénégal (Dakar en priorité).

---

## 🧠 Philosophie de développement — Karpathy Style

> "Complexity is the enemy. If you can't explain it in one sentence, it's too complex."

Ces règles s'appliquent à CHAQUE ligne de code écrite pour Naatal :

### 1. Fichiers plats d'abord
Ne pas créer de dossier tant qu'il n'y a pas au moins 3 fichiers à y mettre.
Mauvais → `lib/audio/utils/recorder/index.ts`
Bon → `lib/audioRecorder.ts`

### 2. Zéro abstraction prématurée
Ne pas abstraire avant d'avoir dupliqué au moins 3 fois.
Si un bout de code n'est utilisé qu'une seule fois, il reste inline.
Mauvais → créer un `useContractValidation()` hook avant d'en avoir besoin
Bon → écrire la logique directement dans le composant, extraire plus tard

### 3. Lisible d'un seul coup d'œil
Chaque fichier doit pouvoir être lu et compris en moins de 60 secondes.
Si un fichier dépasse 200 lignes, se demander si on peut le simplifier — pas le découper en 5 fichiers.

### 4. Pas de sur-ingénierie
Pour le MVP : faire marcher d'abord, optimiser ensuite, seulement si nécessaire.
Mauvais → système de cache multi-niveaux pour les contrats
Bon → `const { data } = await supabase.from('contracts').select('*')`

### 5. Commentaires sur le POURQUOI, jamais le QUOI
```typescript
// ❌ Mauvais — décrit le quoi (visible dans le code)
// On hash le NIN avant de le stocker
const ninHash = sha256(nin + salt)

// ✅ Bon — explique le pourquoi (pas visible dans le code)
// NIN hashé avec salt pour qu'il soit irréversible même si la DB fuit
const ninHash = sha256(nin + salt)
```

### 6. Une fonction = une chose
Si une fonction fait A ET B, c'est deux fonctions.
Taille idéale : 10-30 lignes. Maximum absolu : 60 lignes.

### 7. Noms explicites, pas de commentaires inutiles
```typescript
// ❌ Mauvais
const x = await sb.from('c').select() // récupère les contrats

// ✅ Bon
const contracts = await supabase.from('contracts').select()
```

### 8. Éviter les dépendances inutiles
Avant d'installer un package, se demander :
- Est-ce que je peux l'écrire en 20 lignes moi-même ?
- Est-ce compatible Expo SDK 56 ?
- Est-ce maintenu activement ?

---

## 🏗️ Stack technique — NE PAS CHANGER

```
Mobile        : Expo SDK 56 + React Native 0.85
Navigation    : Expo Router (file-based, version alignée SDK 56)
UI            : NativeWind v4 + StyleSheet natif
Backend       : Appwrite Cloud (Auth + Databases + Storage + Functions)
Audio         : expo-audio (expo-av est supprimé depuis SDK 53)
Caméra        : expo-camera → utiliser CameraView (pas Camera)
OTP SMS       : Twilio via Provider Appwrite Messaging (config dashboard)
Stockage      : Appwrite Storage (buckets `audios` + `cni-photos`, fileSecurity=true)
Hash          : crypto-js SHA-256 (côté client) + Web Crypto SubtleCrypto (Functions)
PDF           : expo-print (génération) + expo-sharing (partage)
```

**⚠️ RÈGLES ABSOLUES STACK**
- Ne jamais changer de stack sans raison critique documentée
- Toujours vérifier compatibilité Expo SDK 56 avant tout nouveau package (`npx expo install <pkg> --check`)
- `expo-camera` : utiliser `CameraView`, PAS l'ancienne API `Camera`
- `expo-router` : syntaxe layouts file-based — ne pas copier du code v3/v4 trouvé en ligne
- `expo-audio` pour tout ce qui est audio — jamais expo-av (supprimé) ni expo-file-system pour ça
- `react-native-appwrite` (SDK client) — `node-appwrite` uniquement dans les Functions
- `expo-print` + `expo-sharing` au lieu de `react-native-html-to-pdf` (incompatible Expo managed workflow)
- **Toujours passer des `Permission.read/update(Role.user(...))` explicites** à chaque `createDocument`/`createFile` — Appwrite n'a pas de RLS, la sécurité est par-document

---

## 📁 Structure du projet — Karpathy Flat

```
naatal/
├── app/                      # Expo Router — écrans uniquement
│   ├── (auth)/
│   │   ├── welcome.tsx       # Splash
│   │   ├── login.tsx         # Numéro téléphone
│   │   ├── otp.tsx           # Vérification OTP
│   │   └── kyc.tsx           # Photo CNI
│   ├── (tabs)/
│   │   ├── index.tsx         # Home — liste contrats
│   │   └── profile.tsx       # Profil
│   ├── contract/
│   │   ├── new.tsx           # Flow création (wizard en 1 fichier tant que < 200 lignes)
│   │   └── [id].tsx          # Détail contrat
│   └── _layout.tsx
├── components/               # Composants UI réutilisables SEULEMENT
│   ├── ContractCard.tsx      # Item liste contrats
│   ├── AudioRecorder.tsx     # Bouton enregistrement
│   ├── AudioPlayer.tsx       # Lecture audio
│   └── OtpInput.tsx          # 6 boxes OTP
├── lib/                      # Utilitaires purs — pas de state
│   ├── supabase.ts           # Client + helpers Supabase
│   ├── hash.ts               # SHA-256 utilities
│   └── pdf.ts                # Génération PDF
├── store/
│   └── contractStore.ts      # Zustand — état contrat en cours UNIQUEMENT
├── types/
│   └── index.ts              # Tous les types en un seul fichier
└── constants/
    ├── colors.ts             # Palette Naatal
    └── questions.ts          # Questions guidées par type
```

**Règle structure Karpathy :**
Ne pas créer de sous-dossiers dans `components/` tant qu'on n'a pas 6+ composants.
Garder `lib/` plat — pas de `lib/audio/`, `lib/contract/`, etc.
Un seul fichier `types/index.ts` pour tout — pas de `types/contract.ts`, `types/user.ts`.

---

## 🗄️ Schéma Données Appwrite

Détail complet : voir `contexe/APPWRITE.md` + config déclarative `appwrite/appwrite.json`.

**Collections** (= tables) — toutes en `documentSecurity: true` :

```
users              → phone, full_name, nin_hash, cni_photo_id, cni_verified
contracts          → reference, type, status, amount, currency, due_date,
                     summary (json string), integrity_hash, created_by, locked_at
contract_parties   → contract_id, user_id, role, has_validated, validated_at, otp_verified
audio_files        → contract_id, question_index, file_id, duration_seconds, file_hash
audit_log          → contract_id, user_id, action, metadata (json string)
                     ⚠️ collection-level $permissions:[] — insert via Function uniquement
```

**Système** : Appwrite ajoute `$id`, `$createdAt`, `$updatedAt`, `$permissions` à chaque document.
Pas de FK natifs — on stocke les `$id` en string. Pas de joins — on fait 2 requêtes ou on dénormalise.

**Bucket** Storage : `files` unique (max 10 MB, privé, `fileSecurity: true`, mime types audios + images). Free tier Appwrite = 1 bucket max → audios et photos CNI cohabitent. Sécurité différenciée par-fichier via `Permission.read(Role.user(...))`.

**Permissions** (remplace RLS) : à chaque création de document/fichier, passer explicitement
`[Permission.read(Role.user(uid)), Permission.update(Role.user(uid))]`.
Pour ajouter une partie à un contrat : UPDATE les `$permissions` du contrat pour inclure le nouveau user.
Pour lock un contrat : la Function `lockContract` retire le `Permission.update` → doc immuable.

---

## 🎨 Design System

```
Couleurs :
  green:        #00A884   action principale, validation
  greenDark:    #008069   pressed state
  greenLight:   #d9fdd3   bulles sortantes
  bg:           #111b21   fond principal
  surface:      #202c33   cartes, headers
  surface2:     #2a3942   inputs, secondary
  text:         #e9edef   texte principal
  muted:        #8696a0   texte secondaire
  gold:         #F5A623   warnings, pending
  red:          #FF6B6B   erreurs, enregistrement

UI :
  - WhatsApp-like : fond sombre, bulles chat
  - 1 action principale par écran — jamais deux boutons primaires
  - Border-radius bouton : 14px | pill : 50px
  - Feedback immédiat sur chaque action
  - Erreurs en français simple, zéro jargon technique
```

---

## 🎤 Questions guidées par type de contrat

```typescript
// constants/questions.ts
export const QUESTIONS = {
  pret: [
    "Quel est le montant exact du prêt ?",
    "Quelle est la date limite de remboursement ?",
    "Y a-t-il des conditions particulières ?",
    "Confirmez à voix haute : 'Je, [votre nom], accepte cet accord librement.'"
  ],
  vente: [
    "Qu'est-ce qui est vendu exactement ?",
    "Quel est le prix convenu ?",
    "Quand la livraison ou le paiement a lieu ?",
    "Confirmez à voix haute : 'Je, [votre nom], accepte cet accord librement.'"
  ],
  service: [
    "Quelle prestation est attendue ?",
    "Quel est le montant convenu ?",
    "Quelle est la date de fin du travail ?",
    "Confirmez à voix haute : 'Je, [votre nom], accepte cet accord librement.'"
  ],
  location: [
    "Qu'est-ce qui est loué ?",
    "Quel est le montant mensuel ?",
    "Quelle est la durée de la location ?",
    "Confirmez à voix haute : 'Je, [votre nom], accepte cet accord librement.'"
  ]
}
```

---

## 🔐 Sécurité — NE JAMAIS VIOLER

1. **NIN** → `SHA-256(NIN + SALT_SECRET)` — salt dans Appwrite Function, jamais côté client
2. **Photos CNI** → bucket Appwrite Storage privé + `Permission.read(Role.user(uid))` — jamais public
3. **Audios** → bucket privé — `Permission.read` pour chaque user des parties uniquement
4. **API key Appwrite** → jamais dans le code client — uniquement env var des Functions
5. **Contrat locked** → la Function `lockContract` retire le `Permission.update` du doc → immuable
6. **Audit log** → collection `$permissions: []` — insert only via Function avec API key

---

## ⚙️ Variables d'environnement

```env
# Client (.env.local) — préfixe EXPO_PUBLIC_ obligatoire pour être exposé au bundle
EXPO_PUBLIC_APPWRITE_ENDPOINT=https://fra.cloud.appwrite.io/v1
EXPO_PUBLIC_APPWRITE_PROJECT_ID=

# Appwrite Functions uniquement (config dashboard, jamais dans .env.local) :
# APPWRITE_API_KEY=    # serveur, scope databases+users+functions
# NIN_HASH_SALT=       # secret, dans la Function hash-nin
```

Twilio est configuré directement dans Appwrite Console → Messaging → Providers, plus besoin de stocker les credentials côté projet.

---

## 🚫 Hors scope MVP — ne pas implémenter

- Paiement Wave/Orange Money intégré
- IA Wolof
- Multi-parties à distance
- Scoring de confiance
- Notifications push avancées
- Arbitrage digital
- Optimisations de performance (cache, pagination avancée)
- Tests automatisés (tester manuellement sur vrai appareil)

---

## 📋 Conventions de code — Karpathy Style

```typescript
// ✅ Nommage explicite
const contracts = await supabase.from('contracts').select()   // clair
const x = await sb.from('c').select()                         // jamais ça

// ✅ Gestion erreur simple et directe
const { data, error } = await supabase.from('contracts').select()
if (error) {
  Alert.alert('Erreur', 'Impossible de charger vos accords. Réessayez.')
  return
}

// ✅ Pas d'abstraction inutile — écrire la logique directement
// Si ça n'est utilisé qu'une fois, pas besoin d'un hook

// ✅ Audio (SDK 56)
// expo-audio remplace expo-av (supprimé depuis SDK 53)
// Hooks : useAudioRecorder, useAudioPlayer
// Format : m4a iOS, mp4 Android — expo-audio gère ça automatiquement
// Durée max : 120 secondes par question
// Permission micro : demander AVANT d'initialiser l'enregistreur

// ✅ expo-camera (SDK 56)
import { CameraView } from 'expo-camera'  // ← API actuelle
// PAS : import { Camera } from 'expo-camera'  ← ancienne API, supprimée
```

---

## 🔄 Flux complet MVP

```
1. Inscription → numéro téléphone → OTP SMS → photo CNI
2. Accueil → liste des contrats existants
3. Créer → type → partie adverse (numéro) → SMS invitation
4. Enregistrement vocal guidé (4 questions)
5. Résumé → OTP double validation
6. Dossier verrouillé → QR code + PDF + hash
```
