import type { ContractType } from '../types';

export const QUESTIONS: Record<ContractType, string[]> = {
  pret: [
    'Quel est le montant exact du prêt ?',
    'Quelle est la date limite de remboursement ?',
    'Y a-t-il des conditions particulières ?',
    "Confirmez à voix haute : 'Je, [votre nom], accepte cet accord librement.'",
  ],
  vente: [
    "Qu'est-ce qui est vendu exactement ?",
    'Quel est le prix convenu ?',
    'Quand la livraison ou le paiement a lieu ?',
    "Confirmez à voix haute : 'Je, [votre nom], accepte cet accord librement.'",
  ],
  service: [
    'Quelle prestation est attendue ?',
    'Quel est le montant convenu ?',
    'Quelle est la date de fin du travail ?',
    "Confirmez à voix haute : 'Je, [votre nom], accepte cet accord librement.'",
  ],
  location: [
    "Qu'est-ce qui est loué ?",
    'Quel est le montant mensuel ?',
    'Quelle est la durée de la location ?',
    "Confirmez à voix haute : 'Je, [votre nom], accepte cet accord librement.'",
  ],
};
