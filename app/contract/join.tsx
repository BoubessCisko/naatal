import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import {
  account,
  databases,
  DB_ID,
  COLLECTIONS,
  Query,
  Permission,
  Role,
} from '../../lib/appwrite';
import type { ContractDoc, ContractPartyDoc } from '../../types';

const TYPE_LABELS: Record<string, string> = {
  vente: 'Vente',
  pret: 'Prêt',
  service: 'Service',
  location: 'Location',
};

export default function JoinContract() {
  const { contractId } = useLocalSearchParams<{ contractId: string }>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [contract, setContract] = useState<ContractDoc | null>(null);
  const [alreadyJoined, setAlreadyJoined] = useState(false);

  useEffect(() => {
    (async () => {
      if (!contractId) return;
      try {
        const doc = await databases.getDocument(DB_ID, COLLECTIONS.contracts, contractId);
        setContract(doc as unknown as ContractDoc);

        const me = await account.get();
        const partiesRes = await databases.listDocuments(DB_ID, COLLECTIONS.parties, [
          Query.equal('contract_id', contractId),
          Query.equal('user_id', me.$id),
          Query.limit(1),
        ]);
        if (partiesRes.documents.length > 0) {
          setAlreadyJoined(true);
        }
      } catch {
        Alert.alert('Erreur', 'Contrat introuvable ou accès refusé.');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [contractId]);

  const handleJoin = async () => {
    if (!contractId || !contract) return;
    setJoining(true);
    try {
      const me = await account.get();

      // Find the unclaimed party slot (user_id is empty)
      const partiesRes = await databases.listDocuments(DB_ID, COLLECTIONS.parties, [
        Query.equal('contract_id', contractId),
        Query.equal('user_id', ''),
        Query.limit(1),
      ]);

      if (partiesRes.documents.length === 0) {
        Alert.alert('Erreur', 'Aucune place disponible dans ce contrat.');
        return;
      }

      const partyDoc = partiesRes.documents[0] as unknown as ContractPartyDoc;

      // Claim the slot: set user_id + add permissions
      await databases.updateDocument(
        DB_ID,
        COLLECTIONS.parties,
        partyDoc.$id,
        { user_id: me.$id },
        [
          Permission.read(Role.user(me.$id)),
          Permission.update(Role.user(me.$id)),
          Permission.read(Role.user(contract.created_by)),
          Permission.update(Role.user(contract.created_by)),
        ]
      );

      // Add party 2's read permission to the contract
      await databases.updateDocument(
        DB_ID,
        COLLECTIONS.contracts,
        contractId,
        {},
        [
          Permission.read(Role.user(contract.created_by)),
          Permission.update(Role.user(contract.created_by)),
          Permission.read(Role.user(me.$id)),
        ]
      );

      router.replace({
        pathname: '/contract/[id]',
        params: { id: contractId },
      });
    } catch (e) {
      Alert.alert(
        'Erreur',
        e instanceof Error ? e.message : 'Impossible de rejoindre le contrat.'
      );
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    );
  }

  if (alreadyJoined) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <Text style={{ fontSize: 40 }}>✓</Text>
        <Text style={styles.title}>Déjà membre</Text>
        <Text style={styles.subtitle}>Vous faites déjà partie de ce contrat.</Text>
        <Pressable
          onPress={() => router.replace({
            pathname: '/contract/[id]',
            params: { id: contractId },
          })}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: pressed ? colors.greenDark : colors.green, marginTop: 24 },
          ]}
        >
          <Text style={styles.ctaText}>Voir le contrat</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Rejoindre un contrat</Text>
      </View>

      <View style={styles.content}>
        {contract && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {TYPE_LABELS[contract.type] ?? contract.type}
            </Text>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Référence</Text>
              <Text style={styles.rowValue}>{contract.reference}</Text>
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
        )}

        <Text style={styles.info}>
          En rejoignant ce contrat, vous acceptez de participer à l'enregistrement
          vocal et à la validation de cet accord.
        </Text>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={handleJoin}
          disabled={joining}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: joining
                ? colors.surface2
                : pressed
                  ? colors.greenDark
                  : colors.green,
            },
          ]}
        >
          {joining ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text style={styles.ctaText}>Rejoindre le contrat</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
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
  content: { flex: 1, padding: 24, gap: 20 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  cardTitle: { color: colors.text, fontSize: 20, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  rowLabel: { color: colors.muted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, fontWeight: '600' },
  title: { color: colors.text, fontSize: 22, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  info: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  cta: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  ctaText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
