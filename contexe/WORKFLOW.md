# WORKFLOW.md — Naatal Development Workflow

---

## 🧠 Comment travailler avec Claude (VS Code + Opus)

### Règle numéro 1 — Toujours donner le contexte

Avant chaque session de code, dire à Claude :
```
"Lis CLAUDE.md. On travaille sur [écran/feature]. 
Voici l'état actuel : [décrire]. 
L'objectif de cette session : [objectif précis]."
```

### Règle numéro 2 — Une chose à la fois

Ne jamais demander à Claude de faire plusieurs features en même temps.
✅ "Code le hook useAudioRecorder avec expo-audio"
❌ "Code le hook audio ET l'écran voice ET l'upload Supabase"

### Règle numéro 3 — Toujours vérifier la version

Avant d'utiliser un package suggéré par Claude :
```bash
npx expo install [package] --check
```
Si le package n'est pas compatible Expo SDK 56 — refuser et chercher l'alternative.

### Règle numéro 4 — Tester l'audio en premier

L'audio est le risque numéro 1. Toujours tester sur vrai appareil Android avant de continuer.

---

## 📋 Process de développement

### Avant de coder une feature
1. Lire la task correspondante dans TASKS.md
2. Vérifier les dépendances dans CLAUDE.md
3. Écrire les types TypeScript en premier
4. Coder le composant / hook
5. Tester sur simulateur
6. Tester sur vrai appareil Android
7. Mettre à jour PROGRESS.md

### Structure d'un commit
```
feat: [nom feature courte]
fix: [description bug]
refactor: [ce qui a changé]
style: [changements UI uniquement]
docs: [mise à jour documentation]
```

### Avant de passer à la feature suivante
- [ ] Fonctionne sur Android physique
- [ ] Pas d'erreurs TypeScript
- [ ] Erreurs gérées avec message utilisateur en français
- [ ] PROGRESS.md mis à jour

---

## 🧪 Stratégie de test

### Phase 1 — Tests développeur (solo)
- Simulateur iOS pour vérification visuelle
- Appareil Android physique pour audio + caméra
- Expo Go pour distribution rapide

### Phase 2 — Tests terrain (commerçants)
- Distribution via lien Expo Go sur WhatsApp
- Observer sans intervenir
- Noter chaque blocage, chaque question
- Ne pas expliquer — si l'utilisateur ne comprend pas seul, c'est un bug UX

### Critères pour passer en Phase 2
- [ ] Flow complet fonctionnel de A à Z
- [ ] Audio enregistrement + lecture OK
- [ ] Photo CNI OK
- [ ] OTP SMS reçu en moins de 30 secondes
- [ ] PDF généré et partageable
- [ ] Aucun crash sur 10 tests consécutifs

---

## 🔧 Commandes utiles

```bash
# Démarrer le projet
npx expo start

# Build APK pour distribution test
eas build --platform android --profile preview

# Vérifier compatibilité package
npx expo install [package] --check

# Reset cache si problème bizarre
npx expo start --clear

# Appwrite CLI — déployer la config déclarative
cd appwrite
appwrite push collections
appwrite push buckets
appwrite push functions

# Voir les logs d'une Function
appwrite functions list-executions --function-id lock-contract
```

---

## 🚨 Problèmes courants et solutions

### Audio ne fonctionne pas sur Android
```typescript
// expo-audio (SDK 56) — toujours demander la permission AVANT d'initialiser
import { AudioModule, useAudioRecorder, RecordingPresets } from 'expo-audio';

const status = await AudioModule.requestRecordingPermissionsAsync();
if (!status.granted) {
  // Afficher message et rediriger vers paramètres
  return;
}
// setAudioModeAsync : config mode lecture/enregistrement
await AudioModule.setAudioModeAsync({
  allowsRecording: true,
  playsInSilentMode: true,
});
```

### Upload Appwrite Storage échoue
```typescript
import { ID, Permission, Role } from 'react-native-appwrite';
import { storage, BUCKETS } from '@/lib/appwrite';

// react-native-appwrite accepte directement l'objet RN file — pas besoin de Blob.
// Bucket unique `files` (limite free tier 1 bucket).
const uploaded = await storage.createFile(
  BUCKETS.files,
  ID.unique(),
  { uri: audioUri, name: filename, type: 'audio/m4a', size: fileSize },
  partyUserIds.map(uid => Permission.read(Role.user(uid)))
);
// uploaded.$id → à stocker dans audio_files.file_id (ou users.cni_photo_id pour les CNI)
```

### OTP SMS non reçu
- Vérifier le format du numéro : toujours +221XXXXXXXXX (E.164)
- Vérifier que le provider Twilio est bien configuré dans Appwrite Console → Messaging → Providers
- Vérifier que Phone Auth est activé : Auth → Settings → Phone (SMS)
- Vérifier les quotas Twilio (balance + numéro vérifié si compte trial)
- Fallback dev : utiliser les `mockNumbers` dans Auth Settings (pas de SMS réel)

### Navigation bloquée
```typescript
// Toujours utiliser router.replace() pour les écrans d'auth
// Utiliser router.push() pour la navigation normale
import { router } from 'expo-router';
router.replace('/(tabs)');  // Auth → App
router.push('/contract/new/type');  // Navigation normale
```

---

## 📦 Packages approuvés pour Expo SDK 56

> Versions exactes pinnées par `npx expo install` au moment de l'install.
> Cette liste est la référence des packages **autorisés** — pas leur version figée.

```
expo                              ~56.x
expo-router                       (version alignée SDK 56)
expo-audio                        (remplace expo-av, supprimé depuis SDK 53)
expo-camera                       (utiliser CameraView, pas Camera)
expo-font                         (Plus Jakarta Sans)
expo-print                        (génération PDF — remplace react-native-html-to-pdf)
expo-sharing                      (partage PDF/QR)
expo-image-manipulator            (compression photos CNI)
expo-notifications                (Phase 2 backlog uniquement)
expo-secure-store                 (session tokens hors AsyncStorage si besoin)

react-native-appwrite             SDK client Appwrite
node-appwrite                     SDK serveur — UNIQUEMENT dans appwrite/functions/
@react-native-async-storage/async-storage

nativewind                        ^4.x
tailwindcss                       ^3.4.x

zustand                           ^5.x
crypto-js                         ^4.x
@types/crypto-js
react-native-qrcode-svg           (Phase 4)
react-native-svg                  (peer dep de qrcode-svg)
```

**Interdits** :
- `expo-av` → supprimé en SDK 53+, utiliser `expo-audio`
- `react-native-html-to-pdf` → incompatible managed workflow, utiliser `expo-print`
- `@supabase/supabase-js` → on a pivoté vers Appwrite (raison : free tier Supabase trop limité)
- `react-native-url-polyfill` → était requis pour Supabase, plus nécessaire pour Appwrite

---

## 🔐 Gestion des secrets

```bash
# Jamais de clés dans le code
# .env.local (gitignored) — uniquement variables PUBLIQUES
EXPO_PUBLIC_APPWRITE_ENDPOINT=xxx     # Visible côté client
EXPO_PUBLIC_APPWRITE_PROJECT_ID=xxx   # Visible côté client (équivalent anon key)

# Secrets (API key serveur, salt NIN, Twilio si Function maison) :
# → Dashboard Appwrite → Functions → <function> → Settings → Variables
# Jamais dans .env.local côté projet
```

---

## 📲 Distribution pour les tests terrain

### Via Expo Go (le plus rapide)
1. `npx expo start`
2. Partager le QR code par WhatsApp
3. L'utilisateur installe Expo Go depuis Play Store
4. Scanne le QR → app chargée

### Via APK (plus professionnel)
```bash
eas build --platform android --profile preview
# Partager le lien de téléchargement par WhatsApp
```

### Message WhatsApp type pour les testeurs
```
Bonjour [nom],

Je développe une application pour sécuriser vos accords commerciaux.
J'ai besoin de votre aide pour la tester.

1. Installez "Expo Go" sur votre téléphone (Play Store)
2. Scannez ce QR code : [QR]
3. Testez librement

Vos retours sont précieux. Merci !
```
