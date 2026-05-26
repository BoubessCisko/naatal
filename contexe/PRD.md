# PRD.md — Naatal v1.0 MVP
*Dernière mise à jour : 24 mai 2026*

---

## 1. Vision

Transformer un accord verbal en dossier de preuve numérique sécurisé, exploitable devant la police et les tribunaux d'Afrique de l'Ouest.

---

## 2. Problème validé

En Afrique de l'Ouest :
- Les accords sont majoritairement **verbaux**
- Quand un litige survient, **aucune preuve exploitable** n'existe
- Le recours à la police ou au tribunal est bloqué faute de preuve
- Les solutions formelles (notaire, contrat écrit) sont inaccessibles à l'économie informelle

**Douleur principale :** Le créancier ne peut pas prouver sa créance. Le débiteur sait qu'il peut nier sans conséquence.

**Insight clé :** La pression psychologique d'une preuve solide résout souvent le litige avant même d'aller à la police.

---

## 3. Solution MVP

Une application mobile (Expo) qui permet de créer en moins de **2 minutes** un dossier de preuve composé de :
- Identité vérifiée des parties (CNI)
- Enregistrements audio guidés
- Confirmation vocale explicite
- Hash d'intégrité
- PDF téléchargeable avec QR code

---

## 4. Cadre juridique

La preuve numérique est reconnue légalement :
- **Sénégal** : Loi sur les transactions électroniques — écrit électronique = force probante équivalente au papier
- **Côte d'Ivoire** : Loi 2013 — signature et preuve électronique recevables
- **CEDEAO** : Acte additionnel harmonisant les transactions électroniques

**Condition légale à remplir :** Identification fiable de l'auteur → **résolue par la photo CNI liée au compte**.

---

## 5. Utilisateurs cibles (MVP)

**Priorité 1 — Commerçant informel**
- Ventes à crédit récurrentes
- Litiges fréquents sur remboursements
- Dakar, marchés Sandaga / HLM / Colobane

**Priorité 2 — Artisan / prestataire**
- Services sans contrat écrit
- Impayés fréquents

**Hors scope MVP :**
- Agriculteurs (saisonnalité complexe)
- Diaspora (usage transfrontalier)

---

## 6. Fonctionnalités MVP

### ✅ Inclus

**Authentification**
- Inscription par numéro de téléphone
- Vérification OTP SMS (Twilio)
- KYC : photo CNI recto + verso
- Hash SHA-256 salté du NIN

**Création de contrat**
- 4 types : Vente | Prêt | Service | Location
- Ajout de la partie adverse (numéro de téléphone)
- Invitation par SMS

**Enregistrement vocal guidé**
- 4 questions par type de contrat (en français)
- Enregistrement audio natif (expo-av)
- Confirmation vocale finale obligatoire : "Je, [nom], accepte cet accord librement"
- Upload sécurisé Supabase Storage

**Validation**
- Résumé automatique structuré
- Validation OTP des deux parties
- Verrouillage irréversible du dossier

**Dossier de preuve**
- ID unique de référence (NTL-YYYY-MMDD-XXXX)
- QR code de vérification
- Hash SHA-256 du dossier complet
- PDF téléchargeable et partageable

**Frais**
- 3 000 FCFA par contrat
- Paiement manuel Wave/Orange Money (MVP)
- Capture screenshot du reçu

### ❌ Hors scope MVP

- Paiement Wave/Orange Money intégré
- IA Wolof / Pulaar
- Multi-parties (plus de 2 contractants)
- Témoins formels
- Scoring de confiance
- Arbitrage digital
- Notifications push avancées

---

## 7. User Journey détaillé

```
ONBOARDING (une seule fois)
┌─────────────────────────────────┐
│ 1. Splash screen                │
│ 2. Numéro de téléphone          │
│ 3. OTP SMS (6 chiffres)         │
│ 4. Nom complet                  │
│ 5. Photo CNI recto              │
│ 6. Photo CNI verso              │
│ 7. Confirmation → Home          │
└─────────────────────────────────┘

CRÉATION CONTRAT
┌─────────────────────────────────┐
│ 1. Bouton + sur Home            │
│ 2. Choisir type (4 options)     │
│ 3. Numéro de téléphone partie 2 │
│    → SMS d'invitation envoyé    │
│ 4. Enregistrement vocal guidé   │
│    (4 questions, micro natif)   │
│ 5. Résumé automatique           │
│    → Vérifier les obligations   │
│ 6. Paiement 3000 FCFA           │
│    → Screenshot reçu Wave/OM    │
│ 7. OTP validation initiateur    │
│ 8. OTP validation partie 2      │
│    (en personne ou à distance)  │
│ 9. Dossier verrouillé ✓         │
└─────────────────────────────────┘

CONSULTATION
┌─────────────────────────────────┐
│ 1. Home → sélectionner contrat  │
│ 2. Voir détails + obligations   │
│ 3. Écouter les audios           │
│ 4. Télécharger PDF              │
│ 5. Partager QR code             │
└─────────────────────────────────┘
```

---

## 8. Dossier de preuve — Composition

| Élément | Description | Protection |
|---|---|---|
| Photo CNI chiffrée | Identité réelle de la partie | AES-256 Supabase Storage |
| Hash NIN | Anti-doublon de compte | SHA-256 + salt |
| Audio Q1-Q4 | Termes de l'accord en voix | Bucket privé |
| Audio confirmation | "J'accepte librement" | Bucket privé |
| Hash dossier | Intégrité de l'ensemble | SHA-256 immutable |
| Timestamp | Horodatage certifié | Supabase + audit log |
| OTP log | Preuve de consentement | Audit log immuable |
| PDF | Document partageable | Généré à la demande |

---

## 9. Modèle économique MVP

**Prix :** 3 000 FCFA flat par contrat créé et validé

**Payé par :** L'initiateur du contrat (celui qui crée)

**Méthode MVP :** Screenshot reçu Wave/Orange Money envoyé dans l'app

**Validation :** Manuelle par l'équipe Naatal en phase de test (< 24h)

**Évolution Phase 2 :** Intégration Wave API + Orange Money API

**Viabilité :**
- Break-even : ~667 contrats/mois
- Objectif mois 3 : 200 contrats/mois (validation terrain)
- Objectif mois 6 : 667 contrats/mois (break-even)

---

## 10. Métriques de succès MVP

| Métrique | Objectif M3 |
|---|---|
| Contrats créés | > 100 |
| Taux de complétion (créé → validé) | > 60% |
| Temps moyen de création | < 3 minutes |
| Taux de satisfaction terrain | > 7/10 |
| Incidents / bugs critiques | 0 |
| Utilisateurs qui reviennent | > 40% |

---

## 11. Risques MVP et mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Audio iOS ne fonctionne pas | Moyenne | Critique | Cibler Android uniquement en phase 1 |
| OTP SMS non livré | Faible | Élevé | Retry automatique + fallback appel vocal |
| Utilisateurs ne comprennent pas l'interface | Élevée | Élevé | Tests terrain semaine 3 avant lancement |
| Faux contrats / fraude | Moyenne | Moyen | CNI obligatoire + audit log |
| Coût Twilio dépasse budget | Faible | Moyen | Plafond OTP + monitoring |

---

## 12. Timeline MVP

```
Semaine 1 : Setup + Auth + KYC
Semaine 2 : Enregistrement audio (priorité absolue)
Semaine 3 : Création contrat complet
Semaine 4 : Dossier final + PDF + tests internes
Semaine 5 : Tests terrain (5-10 commerçants)
Semaine 6 : Corrections + itération
Semaine 7 : Distribution élargie (50 utilisateurs)
```
