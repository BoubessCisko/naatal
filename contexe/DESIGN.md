# DESIGN.md — Naatal Design System

---

## 🎨 Identité visuelle

**Concept :** WhatsApp de la confiance. Familier, sombre, rassurant.
**Émotion cible :** "C'est sérieux, c'est simple, je comprends."
**Anti-pattern :** Jamais corporate, jamais juridique, jamais froid.

---

## 🌈 Palette de couleurs

```typescript
// constants/colors.ts
export const Colors = {
  // Primaires
  green:        '#00A884',  // Action principale, validation
  greenDark:    '#008069',  // Pressed state
  greenLight:   '#d9fdd3',  // Bulles sortantes, succès léger

  // Fonds
  bg:           '#111b21',  // Fond principal app
  surface:      '#202c33',  // Cards, headers, bottom bar
  surface2:     '#2a3942',  // Inputs, secondary cards

  // Textes
  text:         '#e9edef',  // Texte principal
  textMuted:    '#8696a0',  // Labels, placeholders, secondaire

  // États
  gold:         '#F5A623',  // En attente, warning
  red:          '#FF6B6B',  // Erreur, enregistrement actif
  white:        '#ffffff',

  // Bulles chat
  bubbleOut:    '#005c4b',  // Bulle utilisateur (sortante)
  bubbleIn:     '#202c33',  // Bulle IA/système (entrante)
}
```

---

## 📐 Typographie

```typescript
// Famille principale
fontFamily: 'Plus Jakarta Sans'
// Weights utilisés : 400 (normal), 500 (medium), 600 (semibold), 700 (bold), 800 (extrabold)

// Échelle
fontSizes: {
  xs:   11,   // Labels, timestamps, metadata
  sm:   13,   // Corps texte secondaire, hints
  base: 15,   // Corps texte principal
  md:   16,   // Boutons, titres de section
  lg:   18,   // Sous-titres
  xl:   22,   // Titres écran
  xxl:  28,   // Titres importants
  huge: 42,   // Logo, splash
}

// Interlignage
lineHeight: 1.4-1.6 selon le contexte
```

---

## 📏 Espacement

```
Système basé sur multiples de 4px :
4, 8, 12, 16, 20, 24, 32, 40, 48, 64

Padding horizontal standard : 16px
Padding carte : 20px
Gap entre éléments liste : 8px
Border radius carte : 14-16px
Border radius bouton : 14px
Border radius bouton pill : 50px
Border radius avatar : 50% (cercle)
```

---

## 🧩 Composants UI — Spécifications

### StatusBar
```
Height: 44px
Background: surface (#202c33)
Content: heure à gauche, icônes à droite
```

### TopBar / Header
```
Height: ~65px
Background: surface
Contenu : bouton retour (36x36, cercle) | avatar (40x40) | titre+sous-titre | actions
Border-bottom: 1px rgba(255,255,255,0.05)
```

### Bouton primaire
```
Background: green (#00A884)
Text: white, 16px, bold
Border-radius: 14px
Padding: 16px vertical
Width: 100%
Shadow: 0 8px 30px rgba(0,168,132,0.3)
State pressed: scale(0.98)
State disabled: opacity 0.4
```

### Bouton secondaire
```
Background: surface (#202c33)
Text: text (#e9edef), 15px, semibold
Border-radius: 14px
Padding: 16px vertical
Width: 100%
```

### Card
```
Background: surface (#202c33)
Border-radius: 16px
Padding: 20px
Shadow: subtile
```

### Input
```
Background: surface2 (#2a3942)
Border-radius: 12px
Padding: 14px 16px
Text: text (#e9edef), 15px
Placeholder: muted (#8696a0)
Border active: 2px solid green
```

### Avatar
```
Tailles : 36px | 40px | 44px | 52px
Border-radius: 50%
Fallback: gradient coloré + emoji ou initiale
```

### Badge statut
```
Actif    : bg rgba(0,168,132,0.2)  | text green  | "Actif"
Attente  : bg rgba(245,166,35,0.2) | text gold   | "En attente"
Clôturé  : bg rgba(134,150,160,0.2)| text muted  | "Clôturé"
Border-radius: 10px | Padding: 2px 8px | Font: 11px bold
```

### Bulle chat IA (entrante)
```
Background: bubbleIn (#202c33)
Border-radius: 0 16px 16px 16px  ← coin haut gauche carré
Padding: 12px 16px
Max-width: 85%
Align: flex-start
Label IA : 11px, green, bold, margin-bottom 6px
```

### Bulle utilisateur (sortante)
```
Background: bubbleOut (#005c4b)
Border-radius: 16px 16px 0 16px  ← coin bas droit carré
Padding: 12px 16px
Max-width: 85%
Align: flex-end
```

### Bouton enregistrement
```
Taille: 56px cercle
Idle   : bg green, icône 🎤
Active : bg red, animation pulse, icône ⏹
Shadow : 0 4px 16px rgba couleur x0.5
```

### FAB (Floating Action Button)
```
Taille: 60px cercle
Background: green
Icône: + blanc, 28px
Position: absolute bottom 24 right 20
Shadow: 0 8px 24px rgba(0,168,132,0.5)
```

---

## 📱 Écrans — Flux et layout

### 1. Splash / Welcome
```
Layout: centré vertical
Contenu: logo 100x100 (border-radius 28px) | nom app | tagline | bouton CTA
Animation: pulse sur le logo
Background: gradient sombre vert-bleu
```

### 2. Login (téléphone)
```
Layout: padding 32px
Contenu: indicatif pays (+221) | input numéro | bouton envoyer OTP
Note: indicatif fixe Sénégal pour MVP
```

### 3. OTP
```
Layout: centré
Contenu: icône 📱 | titre | sous-titre numéro | 6 boxes OTP | lien renvoyer | bouton valider
Boxes: 52x60px, border-radius 12px, border 2px green si rempli
```

### 4. KYC (CNI)
```
Layout: instructions claires + viewfinder caméra + bouton capture
2 étapes : recto puis verso
Preview de la photo avant validation
```

### 5. Home (liste contrats)
```
Layout: header | search bar | liste scrollable | FAB
Item liste: avatar 52px | nom+preview | date+badge
Séparateur: border-bottom 1px rgba(255,255,255,0.04)
```

### 6. Type de contrat
```
Layout: grille 2x2
Cards: icon 40px | label bold | description 2 lignes
Selected: border 2px green + bg rgba(green, 0.1)
```

### 7. Participants
```
Layout: liste sections
Sections: "Parties contractantes" | "Témoins (optionnel)"
Item: avatar | nom | rôle | check statut
Add item: bordure dashed + icône + label vert
Chips invitation: WhatsApp | SMS | QR Code
```

### 8. Enregistrement vocal
```
Layout: chat scrollable + barre fixe en bas
Barre: bouton rec | hint text | lien "Terminer"
Auto-scroll après chaque nouvelle bulle
```

### 9. Résumé
```
Layout: cards empilées scrollables
Cards: Détails | Parties | Obligations | Audios | Frais
Frais: banner gold avec montant 3 000 FCFA
CTA: "Payer et signer"
```

### 10. Contrat final
```
Layout: centré + scrollable
Contenu: badge succès | titre | ID | banner locked | QR code | proof tags | hash | boutons
QR: fond blanc, 200x200px, border-radius 20px
Hash: font monospace, vert, word-break: break-all
```

---

## 🔄 Animations

```
Transitions écran : fade 300ms ease
Boutons pressed   : scale(0.97-0.98) 150ms
Recording pulse   : scale 1→1.08 1s infinite ease-in-out
Logo splash pulse : shadow 2s infinite
Bulles chat       : fade-in slide-up 200ms
Toast             : translateY + opacity 300ms
Wave audio        : scaleY 0.5→1 staggered 1.2s infinite
OTP boxes fill    : border-color transition 200ms
```

---

## 📲 Responsive

```
Design cible      : 390px width (iPhone 14 / standard)
Minimum supporté  : 360px (Android entrée de gamme)
Maximum supporté  : 430px (iPhone Pro Max)
Orientation       : Portrait uniquement (lockée)
```

---

## ♿ Accessibilité

```
- Labels accessibles sur tous les boutons
- Contraste minimum 4.5:1 sur texte principal
- Touch targets minimum 44x44px
- Messages d'erreur descriptifs en français
- Pas de couleur seule pour communiquer un état (toujours texte + couleur)
```
