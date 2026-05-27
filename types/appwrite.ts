// Types Appwrite — système ($id, $createdAt, etc.) + documents Naatal.
// Pas auto-générés : on les maintient à la main et on les synchronise avec appwrite/appwrite.json.

import type { Models } from 'react-native-appwrite';
import type {
  ContractType,
  ContractStatus,
  PartyRole,
} from './index';

// Champs système ajoutés à chaque document Appwrite.
export type AppwriteDoc = Models.Document;

export type UserDoc = AppwriteDoc & {
  phone: string;
  full_name: string | null;
  nin_hash: string | null;
  cni_photo_id: string | null; // recto — file $id dans le bucket files
  cni_photo_verso_id: string | null; // verso
  cni_verified: boolean;
};

export type ContractDoc = AppwriteDoc & {
  reference: string;
  type: ContractType;
  status: ContractStatus;
  amount: number | null;
  currency: string;
  due_date: string | null;
  summary: string; // JSON stringifié — Appwrite n'a pas d'attribut JSON natif
  integrity_hash: string | null;
  created_by: string; // userId
  locked_at: string | null;
};

export type ContractPartyDoc = AppwriteDoc & {
  contract_id: string;
  user_id: string;
  role: PartyRole;
  has_validated: boolean;
  validated_at: string | null;
  otp_verified: boolean;
};

export type AudioFileDoc = AppwriteDoc & {
  contract_id: string;
  question_index: number;
  file_id: string; // $id Appwrite Storage
  duration_seconds: number | null;
  file_hash: string;
  recorded_by: string; // userId of who recorded
};

export type AuditLogDoc = AppwriteDoc & {
  contract_id: string | null;
  user_id: string | null;
  action: string;
  metadata: string; // JSON stringifié
};
