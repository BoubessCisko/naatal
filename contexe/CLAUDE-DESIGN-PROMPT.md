# Prompt Claude Design — Naatal UI

## Contexte du projet

Tu es le designer principal de **Naatal**, une application mobile africaine qui transforme des accords verbaux en preuves numériques sécurisées. Les utilisateurs sont des commerçants informels, artisans et agriculteurs au Sénégal.

**Philosophie design :**
- WhatsApp-like : familier, sombre, rassurant
- Voice-first : l'audio est l'interface principale
- 1 action par écran — jamais de surcharge
- Zéro jargon juridique visible
- Ultra simple pour des utilisateurs à faible littératie numérique

---

## Design System à respecter STRICTEMENT

```
Couleurs :
  Primaire    : #00A884  (vert WhatsApp)
  Primaire dark: #008069
  Fond        : #111b21
  Surface     : #202c33
  Surface 2   : #2a3942
  Texte       : #e9edef
  Texte muted : #8696a0
  Or/Warning  : #F5A623
  Rouge/Error : #FF6B6B
  Bulle out   : #005c4b
  Bulle in    : #202c33

Typographie :
  Font : Plus Jakarta Sans
  Weights : 400, 600, 700, 800

Composants :
  Border-radius carte    : 16px
  Border-radius bouton   : 14px
  Border-radius pill     : 50px
  Padding horizontal     : 16px
  Bouton primaire        : bg #00A884, text blanc, width 100%
  Bouton secondaire      : bg #202c33, text #e9edef
```

---

## Écrans à designer

### ÉCRAN 1 — Splash / Welcome
**Objectif :** Première impression. Confiance immédiate.
- Logo Naatal (icône 🤝 dans carré arrondi vert)
- Nom "Naatal" en grand, bold
- Tagline : "Transformez vos accords verbaux en preuves numériques"
- Bouton CTA "Commencer"
- Fond sombre avec subtil gradient vert

---

### ÉCRAN 2 — Login (numéro téléphone)
**Objectif :** Friction minimale. Saisie rapide.
- Titre : "Votre numéro de téléphone"
- Sous-titre : "Nous vous enverrons un code de confirmation"
- Sélecteur pays : drapeau 🇸🇳 + "+221" (fixe pour MVP)
- Input grand pour le numéro
- Bouton "Recevoir le code"
- Note de bas : "Votre numéro ne sera jamais partagé"

---

### ÉCRAN 3 — Vérification OTP
**Objectif :** Simple, rassurant.
- Icône 📱 ou SMS
- Titre : "Code de confirmation"
- Sous-titre : "Code envoyé au +221 XX XXX XX XX"
- 6 boxes OTP grandes et claires
- Lien "Renvoyer le code" avec countdown
- Bouton "Valider"

---

### ÉCRAN 4 — KYC (Photo CNI)
**Objectif :** Expliquer clairement pourquoi sans faire peur.
- Titre : "Votre identité"
- Message rassurant : "Pour sécuriser vos accords, nous avons besoin d'une photo de votre carte d'identité. Elle est stockée de façon sécurisée."
- Étape 1 : Cadre viewfinder pour recto CNI + instruction simple
- Étape 2 : Cadre viewfinder pour verso CNI
- Bouton capture
- Preview photo avant validation
- Indicateur de progression (Étape 1/2)

---

### ÉCRAN 5 — Home (liste des accords)
**Objectif :** WhatsApp-like. Familier immédiatement.
- Header : logo "Naatal" + icônes recherche et menu
- Barre de recherche
- Liste des accords (style conversations WhatsApp) :
  - Avatar coloré avec emoji type accord
  - Nom de la partie
  - Preview du contrat (montant, type)
  - Date + badge statut coloré
    - Actif → vert
    - En attente → or
    - Clôturé → gris
- FAB bouton "+" vert en bas à droite
- Bottom navigation : Accords | Alertes | Profil

---

### ÉCRAN 6 — Choix type d'accord
**Objectif :** 4 choix clairs, aucune hésitation.
- Titre : "Quel type d'accord ?"
- Grille 2x2 de cards :
  - 🛒 Vente — "Marchandise, produits"
  - 💰 Prêt — "Argent à rembourser"
  - 🔧 Service — "Travail, prestation"
  - 🏠 Location — "Logement, boutique"
- Sélection : bordure verte + fond vert transparent
- Barre de progression 4 étapes en haut
- Bouton "Continuer" (désactivé jusqu'à sélection)

---

### ÉCRAN 7 — Participants
**Objectif :** Ajouter l'autre partie simplement.
- Titre : "Qui est concerné ?"
- Section "Vous" : votre avatar + nom + "CNI vérifiée ✓"
- Section "Autre partie" :
  - Input numéro de téléphone
  - Bouton invitation : WhatsApp | SMS | QR Code
- Section témoins (collapsed par défaut, optionnel)
- Bouton "Continuer"

---

### ÉCRAN 8 — Enregistrement vocal guidé
**Objectif :** Interface chat. Naturel et guidé.
- Interface style WhatsApp chat, fond sombre
- Bulles IA (entrantes, gauche) :
  - Label "🤖 Assistant Naatal" en vert
  - Question simple en français
- Bulles utilisateur (sortantes, droite) :
  - Message audio avec bouton play + waveform animée + durée
- Barre fixe en bas :
  - Bouton micro (idle : vert / recording : rouge pulsant)
  - Hint : "Appuyez pour répondre"
  - Lien "Terminer" discret
- Auto-scroll vers le bas

---

### ÉCRAN 9 — Résumé de l'accord
**Objectif :** Vérification avant signature. Clair et structuré.
- Titre : "Vérifiez votre accord"
- Cards empilées :
  - 📋 Détails : type, montant, date limite
  - 👥 Parties : noms + statut CNI
  - ⚖️ Obligations : par partie, en langage simple
  - 🎤 Preuves audio : liste des enregistrements avec player
- Banner or : "Frais de validation : 3 000 FCFA"
- Bouton : "Payer et signer →"

---

### ÉCRAN 10 — Dossier final (contrat verrouillé)
**Objectif :** Sentiment de sécurité et de puissance. "C'est béton."
- Badge succès animé 🔒 avec glow vert
- Titre : "Accord sécurisé !"
- ID référence en monospace : NTL-2026-0524-8847
- Banner vert : "🔒 Dossier immuable — impossible de modifier"
- QR code sur fond blanc
- Tags de preuve : CNI vérifiée | 4 audios | OTP validé | Horodaté | Hash SHA-256
- Hash SHA-256 en monospace vert (tronqué)
- Boutons : "Télécharger PDF" + "Partager"

---

## Instructions pour Claude Design

1. **Designer tous les écrans** dans le même fichier React
2. **Respecter le design system** couleurs et typographie définis
3. **Mobile-first** — width 390px, simuler un vrai téléphone
4. **Composants réutilisables** nommés clairement
5. **Interactions simulées** — les boutons naviguent entre les écrans
6. **Commentaires clairs** sur chaque composant pour faciliter la traduction en React Native

## Ce que le développeur fera ensuite

Ce design web sera utilisé comme **spec visuelle exacte** pour coder les composants React Native / Expo. Chaque composant doit être clairement identifiable et traduisible :

```
// Web (Claude Design)           // React Native (traduction)
<div className="flex">     →     <View style={{flexDirection:'row'}}>
<p className="text-sm">    →     <Text style={{fontSize:13}}>
<button onClick>           →     <TouchableOpacity onPress>
```

Nommer chaque composant de façon explicite pour faciliter ce mapping.
