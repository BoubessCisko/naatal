import sha256 from 'crypto-js/sha256';
import {
  databases,
  DB_ID,
  COLLECTIONS,
  Query,
} from './appwrite';
import type { AudioFileDoc, ContractPartyDoc } from '../types';

export async function computeIntegrityHash(contractId: string): Promise<string> {
  const [partiesRes, audiosRes] = await Promise.all([
    databases.listDocuments(DB_ID, COLLECTIONS.parties, [
      Query.equal('contract_id', contractId),
      Query.limit(20),
    ]),
    databases.listDocuments(DB_ID, COLLECTIONS.audios, [
      Query.equal('contract_id', contractId),
      Query.orderAsc('question_index'),
      Query.limit(100),
    ]),
  ]);

  const parties = partiesRes.documents as unknown as ContractPartyDoc[];
  const audios = audiosRes.documents as unknown as AudioFileDoc[];

  const partyFingerprints = parties
    .map((p) => `${p.user_id}:${p.role}`)
    .sort()
    .join('|');

  const audioHashes = audios
    .map((a) => a.file_hash)
    .join('|');

  const payload = [
    contractId,
    partyFingerprints,
    audioHashes,
    new Date().toISOString(),
  ].join('::');

  return sha256(payload).toString();
}
