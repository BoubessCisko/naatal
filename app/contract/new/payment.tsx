import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../../constants/colors';
import { useContractStore } from '../../../store/contractStore';
import {
  account,
  databases,
  DB_ID,
  COLLECTIONS,
  Query,
} from '../../../lib/appwrite';
import { batchUploadAudios } from '../../../lib/audioUpload';

type PaymentStep = 'instructions' | 'submitting' | 'done';

export default function Payment() {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<PaymentStep>('instructions');
  const [progress, setProgress] = useState('');
  const { contractId, reset } = useContractStore();

  const handleConfirmPayment = async () => {
    if (!contractId) {
      Alert.alert('Erreur', 'Aucun contrat en cours.');
      return;
    }
    setStep('submitting');
    try {
      const me = await account.get();

      // Verify this is the initiator
      const contract = await databases.getDocument(DB_ID, COLLECTIONS.contracts, contractId);
      if ((contract as any).created_by !== me.$id) {
        Alert.alert('Accès refusé', 'Seul l\'initiateur peut effectuer le paiement.');
        setStep('instructions');
        return;
      }

      // Batch upload all recorded audios to Appwrite Storage
      setProgress('Upload des enregistrements…');
      const partiesRes = await databases.listDocuments(DB_ID, COLLECTIONS.parties, [
        Query.equal('contract_id', contractId),
        Query.limit(10),
      ]);
      const partyUserIds = partiesRes.documents
        .map((p: any) => p.user_id)
        .filter(Boolean);

      const uploaded = await batchUploadAudios(contractId, partyUserIds);
      setProgress(`${uploaded} audio(s) uploadé(s). Activation…`);

      await databases.updateDocument(
        DB_ID,
        COLLECTIONS.contracts,
        contractId,
        { status: 'pending' }
      );

      setStep('done');
    } catch (e) {
      Alert.alert(
        'Erreur',
        e instanceof Error ? e.message : 'Impossible de finaliser. Réessayez.'
      );
      setStep('instructions');
    }
  };

  const handleGoHome = () => {
    reset();
    router.replace('/(tabs)');
  };

  if (step === 'submitting') {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.green} />
        <Text style={styles.loadingText}>Activation du contrat…</Text>
        <Text style={styles.loadingSubtext}>{progress}</Text>
      </View>
    );
  }

  if (step === 'done') {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <View style={styles.successBadge}>
          <Text style={{ fontSize: 48 }}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Paiement confirmé !</Text>
        <Text style={styles.successSub}>
          Le contrat est maintenant en attente de validation OTP
          par les deux parties.
        </Text>
        <Pressable
          onPress={handleGoHome}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: pressed ? colors.greenDark : colors.green,
              marginTop: 32,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="home" size={20} color="white" />
            <Text style={styles.ctaText}>Retour à l'accueil</Text>
          </View>
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
        <Text style={styles.headerTitle}>Paiement</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>Montant à payer</Text>
          <Text style={styles.amountValue}>3 000 FCFA</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Comment payer ?</Text>
          <View style={styles.methodRow}>
            <Text style={styles.methodIcon}>🟠</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodName}>Orange Money</Text>
              <Text style={styles.methodDetail}>Envoyez au 77 XXX XX XX</Text>
            </View>
          </View>
          <View style={styles.separator} />
          <View style={styles.methodRow}>
            <Text style={styles.methodIcon}>🔵</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.methodName}>Wave</Text>
              <Text style={styles.methodDetail}>Envoyez au 77 XXX XX XX</Text>
            </View>
          </View>
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            Pour le MVP, le paiement est validé manuellement. Appuyez sur
            "Confirmer" après avoir effectué le virement.
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={handleConfirmPayment}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: pressed ? colors.greenDark : colors.green },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="card" size={20} color="white" />
            <Text style={styles.ctaText}>Confirmer le paiement</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
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
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: colors.text, fontSize: 18 },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  content: { flex: 1, padding: 24, gap: 20 },
  amountCard: {
    backgroundColor: 'rgba(0,168,132,0.1)', borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 4, borderWidth: 1, borderColor: 'rgba(0,168,132,0.3)',
  },
  amountLabel: { color: colors.green, fontSize: 13, fontWeight: '600' },
  amountValue: { color: colors.green, fontSize: 36, fontWeight: '800' },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 14 },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  methodIcon: { fontSize: 24 },
  methodName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  methodDetail: { color: colors.muted, fontSize: 13 },
  separator: { height: 1, backgroundColor: colors.surface2 },
  noteCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16 },
  noteText: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  cta: { paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginBottom: 8 },
  ctaText: { color: 'white', fontSize: 16, fontWeight: '600' },
  loadingText: { color: colors.text, fontSize: 18, fontWeight: '600', marginTop: 20 },
  loadingSubtext: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: 8 },
  successBadge: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(0,168,132,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { color: colors.text, fontSize: 26, fontWeight: '700', marginTop: 20 },
  successSub: { color: colors.muted, fontSize: 14, textAlign: 'center', lineHeight: 20, marginTop: 8 },
});
