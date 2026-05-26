// Enums et types de domaine. Les shapes "Document" sont dans ./appwrite.ts.

export type ContractType = 'vente' | 'pret' | 'service' | 'location';
export type ContractStatus = 'draft' | 'pending' | 'active' | 'locked';
export type PartyRole = 'initiateur' | 'partie' | 'temoin';

export type {
  UserDoc,
  ContractDoc,
  ContractPartyDoc,
  AudioFileDoc,
  AuditLogDoc,
} from './appwrite';
