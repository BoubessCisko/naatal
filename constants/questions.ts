import type { ContractType } from '../types';

export type QuestionTarget = 'party1' | 'party2' | 'both';

export type GuidedQuestion = {
  text: string;
  target: QuestionTarget;
};

export type ContractQuestions = {
  party1Role: string;
  party2Role: string;
  questions: GuidedQuestion[];
};

export const QUESTIONS: Record<ContractType, ContractQuestions> = {
  pret: {
    party1Role: 'Prêteur',
    party2Role: 'Emprunteur',
    questions: [
      // Context
      {
        text: 'Dites votre nom complet et le montant exact que vous prêtez aujourd\'hui.',
        target: 'party1',
      },
      {
        text: 'Dites votre nom complet et confirmez le montant que vous recevez.',
        target: 'party2',
      },
      // Terms
      {
        text: 'Comment remettez-vous l\'argent ? (espèces, Wave, Orange Money, autre)',
        target: 'party1',
      },
      {
        text: 'Confirmez-vous avoir reçu cet argent de cette manière ?',
        target: 'party2',
      },
      // Deadline
      {
        text: 'À quelle date l\'emprunteur doit-il rembourser ?',
        target: 'party1',
      },
      {
        text: 'Acceptez-vous cette date de remboursement ?',
        target: 'party2',
      },
      // Conditions
      {
        text: 'Y a-t-il des intérêts, des pénalités de retard, ou d\'autres conditions ?',
        target: 'party1',
      },
      {
        text: 'Comprenez-vous et acceptez-vous ces conditions ?',
        target: 'party2',
      },
      // Repayment plan
      {
        text: 'Comment comptez-vous rembourser ? (en une fois, par tranches, mensuellement)',
        target: 'party2',
      },
      // Final confirmation
      {
        text: 'Dites : "Je, [votre nom], confirme prêter cette somme librement et sans contrainte."',
        target: 'party1',
      },
      {
        text: 'Dites : "Je, [votre nom], confirme emprunter cette somme et m\'engage à la rembourser librement et sans contrainte."',
        target: 'party2',
      },
    ],
  },

  vente: {
    party1Role: 'Vendeur',
    party2Role: 'Acheteur',
    questions: [
      // What is sold
      {
        text: 'Dites votre nom complet et décrivez exactement ce que vous vendez. (objet, quantité, état)',
        target: 'party1',
      },
      {
        text: 'Dites votre nom complet et confirmez ce que vous achetez. Avez-vous vu ou inspecté le bien ?',
        target: 'party2',
      },
      // Price
      {
        text: 'Quel est le prix de vente convenu ?',
        target: 'party1',
      },
      {
        text: 'Confirmez-vous ce prix ? Comment allez-vous payer ? (espèces, Wave, Orange Money, en plusieurs fois)',
        target: 'party2',
      },
      // Delivery
      {
        text: 'Quand et où la livraison du bien aura-t-elle lieu ?',
        target: 'party1',
      },
      {
        text: 'Cette date et ce lieu de livraison vous conviennent-ils ?',
        target: 'party2',
      },
      // Condition & warranty
      {
        text: 'Y a-t-il une garantie ou des conditions sur l\'état du bien ? (retour possible, défauts connus)',
        target: 'party1',
      },
      {
        text: 'Acceptez-vous le bien dans l\'état décrit par le vendeur ?',
        target: 'party2',
      },
      // Final confirmation
      {
        text: 'Dites : "Je, [votre nom], confirme vendre ce bien au prix convenu, librement et sans contrainte."',
        target: 'party1',
      },
      {
        text: 'Dites : "Je, [votre nom], confirme acheter ce bien au prix convenu, librement et sans contrainte."',
        target: 'party2',
      },
    ],
  },

  service: {
    party1Role: 'Prestataire',
    party2Role: 'Client',
    questions: [
      // Describe the service
      {
        text: 'Dites votre nom complet et décrivez la prestation que vous allez réaliser. (nature du travail, détails)',
        target: 'party1',
      },
      {
        text: 'Dites votre nom complet. Est-ce bien la prestation que vous attendez ? Précisez vos attentes.',
        target: 'party2',
      },
      // Price
      {
        text: 'Quel est le montant convenu pour ce service ?',
        target: 'party1',
      },
      {
        text: 'Confirmez-vous ce montant ? Quand comptez-vous payer ? (avant, après, en plusieurs fois)',
        target: 'party2',
      },
      // Timeline
      {
        text: 'Quelle est la date de début et la date de fin prévue du travail ?',
        target: 'party1',
      },
      {
        text: 'Ces délais vous conviennent-ils ?',
        target: 'party2',
      },
      // Quality & expectations
      {
        text: 'Quels matériaux ou moyens fournissez-vous ? Le client doit-il fournir quelque chose ?',
        target: 'party1',
      },
      {
        text: 'Que se passe-t-il si le travail n\'est pas satisfaisant ? (reprise, remboursement)',
        target: 'party2',
      },
      // Final confirmation
      {
        text: 'Dites : "Je, [votre nom], m\'engage à réaliser cette prestation aux conditions convenues, librement et sans contrainte."',
        target: 'party1',
      },
      {
        text: 'Dites : "Je, [votre nom], m\'engage à payer cette prestation aux conditions convenues, librement et sans contrainte."',
        target: 'party2',
      },
    ],
  },

  location: {
    party1Role: 'Bailleur',
    party2Role: 'Locataire',
    questions: [
      // Property description
      {
        text: 'Dites votre nom complet et décrivez le bien que vous mettez en location. (type, adresse, état)',
        target: 'party1',
      },
      {
        text: 'Dites votre nom complet. Avez-vous visité le bien ? Confirmez que l\'état vous convient.',
        target: 'party2',
      },
      // Rent
      {
        text: 'Quel est le montant du loyer mensuel et quand doit-il être payé chaque mois ?',
        target: 'party1',
      },
      {
        text: 'Confirmez-vous ce montant et cette date de paiement ?',
        target: 'party2',
      },
      // Deposit
      {
        text: 'Y a-t-il une caution ? Si oui, de combien ? Quand sera-t-elle rendue ?',
        target: 'party1',
      },
      {
        text: 'Acceptez-vous le montant de la caution et les conditions de restitution ?',
        target: 'party2',
      },
      // Duration
      {
        text: 'Quelle est la durée de la location ? (date de début, durée minimale, préavis de départ)',
        target: 'party1',
      },
      {
        text: 'Acceptez-vous cette durée et les conditions de préavis ?',
        target: 'party2',
      },
      // Rules
      {
        text: 'Y a-t-il des règles particulières ? (sous-location interdite, animaux, travaux, charges)',
        target: 'party1',
      },
      {
        text: 'Comprenez-vous et acceptez-vous ces règles ?',
        target: 'party2',
      },
      // Final confirmation
      {
        text: 'Dites : "Je, [votre nom], confirme louer ce bien aux conditions convenues, librement et sans contrainte."',
        target: 'party1',
      },
      {
        text: 'Dites : "Je, [votre nom], confirme prendre en location ce bien aux conditions convenues, librement et sans contrainte."',
        target: 'party2',
      },
    ],
  },
};
