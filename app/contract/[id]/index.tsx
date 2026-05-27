import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import { colors } from '../../../constants/colors';
import {
  account,
  databases,
  DB_ID,
  COLLECTIONS,
  Query,
} from '../../../lib/appwrite';
import { generateAndSharePdf } from '../../../lib/pdf';
import { computeIntegrityHash } from '../../../lib/hash';
import type { ContractDoc, ContractPartyDoc } from '../../../types';

const TYPE_LABELS: Record<string, string> = {
  vente: 'Vente',
  pret: 'Prêt',
  service: 'Service',
  location: 'Location',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Brouillon', color: colors.muted, bg: 'rgba(134,150,160,0.2)' },
  pending: { label: 'En attente de validation', color: colors.gold, bg: 'rgba(245,166,35,0.15)' },
  active: { label: 'Actif', color: colors.green, bg: 'rgba(0,168,132,0.15)' },
  locked: { label: 'Verrouillé — Dossier immuable', color: colors.green, bg: 'rgba(0,168,132,0.15)' },
};

export default function ContractDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [contract, setContract] = useState<ContractDoc | null>(null);
  const [parties, setParties] = useState<ContractPartyDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [locking, setLocking] = useState(false);
  const [myUserId, setMyUserId] = useState('');

  const fetchContract = useCallback(async () => {
    if (!id) return;
    try {
      const me = await account.get();
      setMyUserId(me.$id);
      const [doc, partiesRes] = await Promise.all([
        databases.getDocument(DB_ID, COLLECTIONS.contracts, id),
        databases.listDocuments(DB_ID, COLLECTIONS.parties, [
          Query.equal('contract_id', id),
          Query.limit(10),
        ]),
      ]);
      setContract(doc as unknown as ContractDoc);
      setParties(partiesRes.documents as unknown as ContractPartyDoc[]);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de charger le contrat.');
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContract();
  }, [fetchContract]);

  const handleLock = async () => {
    if (!contract || contract.status === 'locked') return;
    Alert.alert(
      'Verrouiller le contrat ?',
      'Cette action est irréversible. Le dossier deviendra immuable.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Verrouiller',
          style: 'destructive',
          onPress: async () => {
            setLocking(true);
            try {
              const hash = await computeIntegrityHash(contract.$id);
              await databases.updateDocument(
                DB_ID,
                COLLECTIONS.contracts,
                contract.$id,
                {
                  status: 'locked',
                  integrity_hash: hash,
                  locked_at: new Date().toISOString(),
                }
              );
              await fetchContract();
            } catch (e) {
              Alert.alert(
                'Erreur',
                e instanceof Error ? e.message : 'Impossible de verrouiller.'
              );
            } finally {
              setLocking(false);
            }
          },
        },
      ]
    );
  };

  const handleSharePdf = async () => {
    if (!contract) return;
    try {
      const partyData = parties.map((p) => ({
        role: p.role,
        phone: p.user_id || '—',
      }));
      await generateAndSharePdf(contract, partyData);
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de générer le PDF.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  if (!contract) return null;

  const statusCfg = STATUS_CONFIG[contract.status] ?? STATUS_CONFIG.draft;
  const isLocked = contract.status === 'locked';
  const isInitiator = myUserId === contract.created_by;
  const verificationUrl = `naatal://verify/${contract.$id}`;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{contract.reference}</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status banner */}
        <View style={[styles.statusBanner, { backgroundColor: statusCfg.bg }]}>
          <Text style={{ fontSize: 20 }}>{isLocked ? '🔒' : '📋'}</Text>
          <Text style={[styles.statusText, { color: statusCfg.color }]}>
            {statusCfg.label}
          </Text>
        </View>

        {/* Contract info */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Référence</Text>
            <Text style={styles.rowValue}>{contract.reference}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Type</Text>
            <Text style={styles.rowValue}>{TYPE_LABELS[contract.type] ?? contract.type}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Date</Text>
            <Text style={styles.rowValue}>
              {new Date(contract.$createdAt).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          {contract.amount ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Montant</Text>
              <Text style={styles.rowValue}>
                {contract.amount.toLocaleString()} {contract.currency}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Parties */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Parties</Text>
          {parties.map((p) => (
            <View key={p.$id} style={styles.partyRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {p.role.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.partyRole}>{p.role}</Text>
                <Text style={styles.partyStatus}>
                  {p.has_validated ? '✓ Validé' : 'En attente'}
                </Text>
              </View>
              {p.otp_verified && (
                <View style={styles.verifiedBadge}>
                  <Text style={{ color: colors.green, fontSize: 11, fontWeight: '700' }}>OTP ✓</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Proof tags */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preuves</Text>
          <View style={styles.tagRow}>
            {['CNI', 'Audios', 'OTP', 'Horodaté', 'Hash'].map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* QR Code */}
        <View style={[styles.card, { alignItems: 'center' }]}>
          <Text style={styles.cardTitle}>QR Code de vérification</Text>
          <View style={styles.qrBox}>
            <QRCode
              value={verificationUrl}
              size={180}
              backgroundColor="white"
              color={colors.bg}
            />
          </View>
          <Text style={styles.qrHint}>Scannez pour vérifier l'authenticité</Text>
        </View>

        {/* Integrity hash */}
        {contract.integrity_hash && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Empreinte SHA-256</Text>
            <Text style={styles.hashText}>{contract.integrity_hash}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsCard}>
          {(contract.status === 'draft' || contract.status === 'pending') && (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/contract/[id]/voice',
                  params: { id: contract.$id },
                })
              }
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: pressed ? colors.surface : colors.surface2 },
              ]}
            >
              <Text style={[styles.actionButtonText, { color: colors.text }]}>
                Enregistrement vocal
              </Text>
            </Pressable>
          )}

          {contract.status === 'pending' && (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/contract/validate',
                  params: { contractId: contract.$id },
                })
              }
              style={({ pressed }) => [
                styles.actionButton,
                { backgroundColor: pressed ? '#c8850a' : colors.gold },
              ]}
            >
              <Text style={styles.actionButtonText}>
                Valider avec OTP
              </Text>
            </Pressable>
          )}

          {/* Lock — initiator only */}
          {contract.status === 'active' && isInitiator && (
            <Pressable
              onPress={handleLock}
              disabled={locking}
              style={({ pressed }) => [
                styles.actionButton,
                {
                  backgroundColor: locking
                    ? colors.surface2
                    : pressed
                      ? colors.greenDark
                      : colors.green,
                },
              ]}
            >
              {locking ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.actionButtonText}>
                  Verrouiller le dossier
                </Text>
              )}
            </Pressable>
          )}

          {/* PDF — both parties */}
          <Pressable
            onPress={handleSharePdf}
            style={({ pressed }) => [
              styles.actionButton,
              {
                backgroundColor: pressed ? colors.surface : colors.surface2,
              },
            ]}
          >
            <Text style={[styles.actionButtonText, { color: colors.text }]}>
              Télécharger PDF
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.surface,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: colors.text, fontSize: 18 },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
  },
  statusText: { fontSize: 15, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: { color: colors.muted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: 'white', fontSize: 16, fontWeight: '700' },
  partyRole: { color: colors.text, fontSize: 14, fontWeight: '600' },
  partyStatus: { color: colors.muted, fontSize: 12 },
  verifiedBadge: {
    backgroundColor: 'rgba(0,168,132,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    backgroundColor: 'rgba(0,168,132,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  tagText: { color: colors.green, fontSize: 12, fontWeight: '700' },
  qrBox: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginVertical: 8,
  },
  qrHint: { color: colors.muted, fontSize: 12 },
  hashText: {
    color: colors.green,
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  actionsCard: { gap: 12 },
  actionButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  actionButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
