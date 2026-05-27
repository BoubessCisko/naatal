import { Client, Databases, Permission, Role } from 'node-appwrite';

const DB_ID = 'naatal';
const COLLECTIONS = {
  contracts: 'contracts',
  parties: 'contract_parties',
  audios: 'audio_files',
  audit: 'audit_log',
};

export default async ({ req, res, log, error }) => {
  const { contractId } = JSON.parse(req.body || '{}');
  if (!contractId) {
    return res.json({ success: false, error: 'contractId required' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(req.headers['x-appwrite-key'] ?? '');

  const db = new Databases(client);

  try {
    // 1. Verify all parties have validated
    const parties = await db.listDocuments(DB_ID, COLLECTIONS.parties, [
      `equal("contract_id", "${contractId}")`,
    ]);
    const allValidated = parties.documents.every((p) => p.has_validated === true);
    if (!allValidated) {
      return res.json({ success: false, error: 'Not all parties validated' }, 400);
    }

    // 2. Compute integrity hash
    const audios = await db.listDocuments(DB_ID, COLLECTIONS.audios, [
      `equal("contract_id", "${contractId}")`,
      `orderAsc("question_index")`,
    ]);
    const partyFingerprints = parties.documents
      .map((p) => `${p.user_id}:${p.role}`)
      .sort()
      .join('|');
    const audioHashes = audios.documents.map((a) => a.file_hash).join('|');
    const timestamp = new Date().toISOString();

    // Simple hash using Web Crypto
    const payload = `${contractId}::${partyFingerprints}::${audioHashes}::${timestamp}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const integrityHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    // 3. Lock the contract: remove update permissions, set status + hash
    const readPermissions = parties.documents.map((p) =>
      Permission.read(Role.user(p.user_id))
    );

    await db.updateDocument(DB_ID, COLLECTIONS.contracts, contractId, {
      status: 'locked',
      integrity_hash: integrityHash,
      locked_at: timestamp,
    }, readPermissions); // No Permission.update → immutable

    // 4. Write audit log (collection has no client permissions)
    for (const party of parties.documents) {
      await db.createDocument(DB_ID, COLLECTIONS.audit, 'unique()', {
        contract_id: contractId,
        user_id: party.user_id,
        action: 'contract_locked',
        metadata: JSON.stringify({
          integrity_hash: integrityHash,
          locked_at: timestamp,
          party_role: party.role,
        }),
      });
    }

    log(`Contract ${contractId} locked with hash ${integrityHash}`);
    return res.json({ success: true, integrity_hash: integrityHash });
  } catch (e) {
    error(`Lock failed: ${e.message}`);
    return res.json({ success: false, error: e.message }, 500);
  }
};
