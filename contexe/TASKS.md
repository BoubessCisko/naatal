# TASKS.md — Naatal MVP Task List

> Légende : 🔴 Bloquant | 🟠 Important | 🟡 Nice-to-have
> Statut : ⬜ À faire | 🔄 En cours | ✅ Terminé | ❌ Bloqué

---

## PHASE 0 — Setup (Jour 1)

### 0.1 Initialisation projet
- ✅ 🔴 `npx create-expo-app naatal --template expo-template-blank-typescript` (déjà fait, SDK 56)
- ⬜ 🔴 Installer Expo Router + deps (`npx expo install expo-router react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated expo-linking expo-constants`)
- ⬜ 🔴 Configurer NativeWind v4 (`tailwindcss`, `babel.config.js`, `metro.config.js`, `global.css`)
- ⬜ 🔴 Créer la structure de dossiers (app/, components/, hooks/, lib/, store/, types/, constants/, supabase/migrations/)
- ⬜ 🔴 Configurer `constants/colors.ts` avec la palette Naatal
- ⬜ 🔴 Installer et configurer `Plus Jakarta Sans` avec expo-font + @expo-google-fonts/plus-jakarta-sans

### 0.2 Appwrite (pivot depuis Supabase — voir PROGRESS.md 26/05/2026)
- ⬜ 🔴 Créer compte + projet sur https://cloud.appwrite.io (région Frankfurt)
- ⬜ 🔴 Ajouter une plateforme React Native (package `com.naatal.app`)
- ⬜ 🔴 Déployer `appwrite/appwrite.json` via CLI : `appwrite push collections && appwrite push buckets`
       (ou recréer manuellement les 5 collections + 2 buckets via console)
- ⬜ 🔴 Activer Phone Auth dans Auth → Settings → Phone (SMS)
- ⬜ 🔴 Configurer le Provider Twilio dans Messaging → Providers → SMS → Twilio
- ⬜ 🔴 Vérifier que `lib/appwrite.ts` charge bien (client log-in test depuis l'app)
- ✅ 🔴 `appwrite/appwrite.json` prêt (schéma déclaratif : 5 collections + 2 buckets + indexes + permissions)
- ✅ 🔴 `types/appwrite.ts` prêt (types `*Doc` synchronisés avec appwrite.json)

### 0.3 Variables d'environnement
- ⬜ 🔴 `cp .env.local.example .env.local` et remplir `EXPO_PUBLIC_APPWRITE_ENDPOINT` + `EXPO_PUBLIC_APPWRITE_PROJECT_ID`
- ✅ 🔴 `.env.local` est dans `.gitignore` (déjà fait)
- ✅ 🔴 `app.config.ts` créé (typedRoutes, scheme `naatal`, permissions iOS/Android, bundleIds)

---

## PHASE 1 — Authentification (Semaine 1)

### 1.1 Écran Welcome / Splash
- ⬜ 🔴 Créer `app/(auth)/welcome.tsx`
- ⬜ 🔴 Logo + animation pulse
- ⬜ 🔴 Tagline en français
- ⬜ 🔴 Bouton "Commencer"
- ⬜ 🟠 Vérifier si déjà connecté → rediriger vers tabs

### 1.2 Écran Login (téléphone)
- ⬜ 🔴 Créer `app/(auth)/login.tsx`
- ⬜ 🔴 Sélecteur indicatif pays (+221 Sénégal par défaut)
- ⬜ 🔴 Input numéro avec formatage automatique
- ⬜ 🔴 Validation format numéro (7 chiffres après indicatif)
- ⬜ 🔴 Appel Appwrite `account.createPhoneToken(ID.unique(), phone)` — stocker le `userId` retourné
- ⬜ 🔴 Gestion erreurs en français

### 1.3 Écran OTP
- ⬜ 🔴 Créer `app/(auth)/otp.tsx`
- ⬜ 🔴 6 boxes de saisie OTP
- ⬜ 🔴 Auto-focus entre les boxes
- ⬜ 🔴 Auto-submit quand 6 chiffres saisis
- ⬜ 🔴 Vérification OTP avec Appwrite : `account.createSession(userId, token)`
- ⬜ 🔴 Compte à rebours "Renvoyer dans X secondes"
- ⬜ 🔴 Lien "Renvoyer le code"
- ⬜ 🔴 Redirection post-auth : KYC si pas de profil ou `!cni_verified` | Home sinon

### 1.4 Écran KYC (CNI)
- ⬜ 🔴 Créer `app/(auth)/kyc.tsx`
- ⬜ 🔴 Installer `expo-camera`
- ⬜ 🔴 Demande de permission caméra
- ⬜ 🔴 Viewfinder avec cadre guide (rectangle CNI)
- ⬜ 🔴 Capture photo recto
- ⬜ 🔴 Preview + validation ou reprise
- ⬜ 🔴 Capture photo verso
- ⬜ 🔴 Upload vers Appwrite Storage bucket `files` (`storage.createFile`) + permission `Role.user(uid)` read-only (jamais d'autres users sur photo CNI)
- ⬜ 🔴 Saisie manuelle nom complet + NIN
- ⬜ 🔴 Hash SHA-256 salté du NIN → stocker en base
- ⬜ 🔴 Marquer `cni_verified: true` en base
- ⬜ 🟠 Compression image avant upload (max 800KB)

### 1.5 Store auth
- ⬜ 🔴 Créer `store/authStore.ts` avec Zustand
- ⬜ 🔴 État : user, session, isLoading
- ⬜ 🔴 Actions : login, logout, updateProfile
- ⬜ 🔴 Persistance session avec AsyncStorage

---

## PHASE 2 — Enregistrement audio (Semaine 2) ⚠️ PRIORITÉ ABSOLUE

### 2.1 Hook useAudioRecorder (avec expo-audio — pas expo-av)
- ⬜ 🔴 Créer `hooks/useAudioRecorder.ts`
- ⬜ 🔴 Demande permission micro (`AudioModule.requestRecordingPermissionsAsync`)
- ⬜ 🔴 Configuration mode audio (`AudioModule.setAudioModeAsync`)
- ⬜ 🔴 Démarrer enregistrement avec `useAudioRecorder(RecordingPresets.HIGH_QUALITY)`
- ⬜ 🔴 Arrêter et récupérer URI du fichier
- ⬜ 🔴 Durée maximale : 120 secondes avec auto-stop
- ⬜ 🔴 Timer en temps réel pendant enregistrement
- ⬜ 🔴 Gestion erreurs permission refusée

### 2.2 Composant AudioRecorder
- ⬜ 🔴 Créer `components/audio/AudioRecorder.tsx`
- ⬜ 🔴 Bouton enregistrement (idle | recording | done)
- ⬜ 🔴 Animation pulse rouge pendant enregistrement
- ⬜ 🔴 Indicateur durée en temps réel
- ⬜ 🔴 Option re-enregistrer

### 2.3 Composant AudioPlayer
- ⬜ 🔴 Créer `components/audio/AudioPlayer.tsx`
- ⬜ 🔴 Bouton play/pause
- ⬜ 🔴 Visualisation waveform (barres animées)
- ⬜ 🔴 Durée totale + position actuelle
- ⬜ 🔴 Compatible avec URI local ET URL Supabase

### 2.4 Upload audio
- ⬜ 🔴 Créer `lib/audioUpload.ts`
- ⬜ 🔴 Convertir URI → Blob
- ⬜ 🔴 Upload vers Appwrite Storage bucket `files` (`storage.createFile`) + permissions read pour toutes les parties du contrat
- ⬜ 🔴 Calculer SHA-256 du fichier audio (crypto-js)
- ⬜ 🔴 Sauvegarder `file_id` Appwrite + hash dans collection `audio_files`
- ⬜ 🔴 Gestion retry sur échec réseau

### 2.5 ⚠️ Test sur vrai appareil Android
- ⬜ 🔴 Tester enregistrement sur Android physique
- ⬜ 🔴 Tester upload sur connexion 4G (pas WiFi)
- ⬜ 🔴 Tester lecture après upload
- ⬜ 🔴 Valider la qualité audio acceptable

---

## PHASE 3 — Création de contrat (Semaine 3)

### 3.1 Écran Home
- ⬜ 🔴 Créer `app/(tabs)/index.tsx`
- ⬜ 🔴 Header avec logo Naatal
- ⬜ 🔴 Barre de recherche
- ⬜ 🔴 Liste des contrats depuis Supabase (realtime)
- ⬜ 🔴 Item : avatar | nom partie | preview | date | badge statut
- ⬜ 🔴 FAB bouton + vert
- ⬜ 🔴 État vide (premier lancement)
- ⬜ 🟠 Pull-to-refresh

### 3.2 Écran Type de contrat
- ⬜ 🔴 Créer `app/contract/new/type.tsx`
- ⬜ 🔴 Grille 2x2 (Vente | Prêt | Service | Location)
- ⬜ 🔴 Cards avec icône + label + description
- ⬜ 🔴 Sélection avec feedback visuel (border green)
- ⬜ 🔴 Bouton "Continuer" activé après sélection
- ⬜ 🔴 Sauvegarder type dans `store/contractStore.ts`

### 3.3 Écran Participants
- ⬜ 🔴 Créer `app/contract/new/participants.tsx`
- ⬜ 🔴 Afficher l'initiateur (utilisateur connecté)
- ⬜ 🔴 Input numéro de téléphone partie 2
- ⬜ 🔴 Validation format numéro
- ⬜ 🔴 Envoi SMS d'invitation (Appwrite Function `send-invite` via Twilio configuré)
- ⬜ 🔴 Chips : WhatsApp | SMS | QR Code
- ⬜ 🟠 Section témoins optionnels

### 3.4 Écran Enregistrement vocal
- ⬜ 🔴 Créer `app/contract/new/voice.tsx`
- ⬜ 🔴 Interface chat (bulles IA + bulles utilisateur)
- ⬜ 🔴 Questions guidées selon le type de contrat (constants/questions.ts)
- ⬜ 🔴 Intégrer AudioRecorder + AudioPlayer
- ⬜ 🔴 Auto-scroll vers le bas après chaque bulle
- ⬜ 🔴 Question suivante après enregistrement validé
- ⬜ 🔴 Question finale de confirmation vocale
- ⬜ 🔴 Bouton "Terminer" en dernier
- ⬜ 🔴 Sauvegarder tous les URIs audio dans le store

### 3.5 Écran Résumé
- ⬜ 🔴 Créer `app/contract/new/summary.tsx`
- ⬜ 🔴 Card Détails (type, montant, date)
- ⬜ 🔴 Card Parties (nom + statut CNI)
- ⬜ 🔴 Card Obligations (par partie)
- ⬜ 🔴 Card Audios (liste avec player)
- ⬜ 🔴 Banner Frais 3 000 FCFA (gold)
- ⬜ 🔴 Bouton "Payer et signer"

### 3.6 Écran Paiement
- ⬜ 🔴 Créer `app/contract/new/payment.tsx`
- ⬜ 🔴 Instructions Wave / Orange Money
- ⬜ 🔴 Numéro de compte à payer
- ⬜ 🔴 Option upload screenshot reçu
- ⬜ 🔴 Confirmation manuelle
- ⬜ 🔴 Message "En cours de validation"

### 3.7 Store contrat
- ⬜ 🔴 Créer `store/contractStore.ts`
- ⬜ 🔴 État : type, parties, audios, summary
- ⬜ 🔴 Actions : reset, updateField
- ⬜ 🔴 Reset automatique après validation

---

## PHASE 4 — Validation et dossier final (Semaine 4)

### 4.1 Flow validation OTP double
- ⬜ 🔴 OTP initiateur → vérification Appwrite (`account.createSession`)
- ⬜ 🔴 OTP partie 2 → vérification Appwrite
- ⬜ 🔴 Mise à jour statut contrat : pending → active → locked
- ⬜ 🔴 Function `lock-contract` : retire `Permission.update` du doc + écrit integrity_hash
- ⬜ 🔴 Écriture audit log pour chaque validation (via Function avec API key)

### 4.2 Génération hash dossier
- ⬜ 🔴 Créer `lib/hash.ts`
- ⬜ 🔴 Concatener : contract_id + parties + audios_hashes + timestamp
- ⬜ 🔴 SHA-256 de la concatenation
- ⬜ 🔴 Stocker en base `contracts.integrity_hash`
- ⬜ 🔴 Immuable après génération

### 4.3 Génération QR code
- ⬜ 🔴 Installer `react-native-qrcode-svg`
- ⬜ 🔴 Encoder : URL de vérification + contract_id
- ⬜ 🔴 Afficher dans l'écran final
- ⬜ 🟠 Permettre de sauvegarder le QR en image

### 4.4 Génération PDF
- ⬜ 🔴 Créer `lib/pdf.ts`
- ⬜ 🔴 Template HTML du dossier de preuve
- ⬜ 🔴 Inclure : ID, parties, obligations, hash, QR code, timestamp
- ⬜ 🔴 Générer PDF avec `expo-print` (`Print.printToFileAsync`)
- ⬜ 🔴 Partager via `expo-sharing`
- ⬜ 🟠 Watermark "NAATAL — Dossier certifié"

### 4.5 Écran Contrat final
- ⬜ 🔴 Créer `app/contract/[id].tsx`
- ⬜ 🔴 Badge succès animé
- ⬜ 🔴 ID de référence
- ⬜ 🔴 Banner "Dossier immuable"
- ⬜ 🔴 QR code
- ⬜ 🔴 Proof tags (CNI | Audios | OTP | Horodaté | Hash)
- ⬜ 🔴 Hash SHA-256 affiché
- ⬜ 🔴 Bouton "Télécharger PDF"
- ⬜ 🔴 Bouton "Partager"

---

## PHASE 5 — Tests et corrections (Semaines 5-6)

### 5.1 Tests internes
- ⬜ 🔴 Test flow complet A→Z sur Android
- ⬜ 🔴 Test sur 3 appareils Android différents
- ⬜ 🔴 Test sur connexion 3G lente
- ⬜ 🔴 Test sur téléphone avec peu de stockage
- ⬜ 🔴 Vérifier aucun crash sur 20 tests consécutifs

### 5.2 Tests terrain
- ⬜ 🔴 Identifier 5-10 commerçants volontaires
- ⬜ 🔴 Session d'observation (sans expliquer)
- ⬜ 🔴 Noter tous les points de friction
- ⬜ 🔴 Interviews post-test (5 min max)
- ⬜ 🔴 Prioriser les corrections

### 5.3 Corrections prioritaires
- ⬜ À définir après les tests terrain

---

## BACKLOG — Phase 2 (post-validation)

- ⬜ 🟠 Intégration Wave API pour paiement
- ⬜ 🟠 Intégration Orange Money API
- ⬜ 🟠 Ajout témoins formels
- ⬜ 🟠 Support Wolof (questions guidées)
- ⬜ 🟡 Notifications push (rappels échéance)
- ⬜ 🟡 Scoring de confiance utilisateur
- ⬜ 🟡 Arbitrage digital
- ⬜ 🟡 Publication Play Store
- ⬜ 🟡 Publication App Store

---

## Notes importantes

> **L'audio est le risque numéro 1.** Si expo-av pose des problèmes sur Android en semaine 2, tout s'arrête jusqu'à résolution.

> **Ne pas passer à la phase suivante** sans avoir testé l'audio sur un vrai appareil Android physique.

> **Toujours mettre à jour PROGRESS.md** après chaque tâche complétée.
