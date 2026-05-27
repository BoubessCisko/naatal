import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../constants/colors';
import { useContractStore } from '../../../store/contractStore';
import AudioPlayer from '../../../components/AudioPlayer';
import { formatTime } from '../../../lib/formatTime';

const TYPE_LABELS: Record<string, string> = {
  vente: 'Vente',
  pret: 'Prêt',
  service: 'Service',
  location: 'Location',
};


export default function Summary() {
  const { type, parties, audios, documents } = useContractStore();
  const insets = useSafeAreaInsets();

  const totalDuration = audios.reduce((sum, a) => sum + a.durationMs, 0);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Résumé</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Contract details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Détails</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Type</Text>
            <Text style={styles.rowValue}>
              {TYPE_LABELS[type ?? ''] ?? '—'}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Enregistrements</Text>
            <Text style={styles.rowValue}>
              {audios.length} ({formatTime(Math.floor(totalDuration / 1000))})
            </Text>
          </View>
        </View>

        {/* Parties */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Parties</Text>
          {parties.map((p, i) => (
            <View key={i} style={styles.partyRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(p.name ?? p.phone).charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.partyName}>{p.name ?? p.phone}</Text>
                <Text style={styles.partyRole}>
                  {p.role === 'initiateur' ? 'Initiateur' : 'Partie'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Audio recordings */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Enregistrements vocaux</Text>
          {audios.map((a, i) => (
            <View key={i} style={{ gap: 4 }}>
              <Text style={styles.audioLabel}>Question {i + 1}</Text>
              <AudioPlayer uri={a.uri} durationMs={a.durationMs} />
            </View>
          ))}
        </View>

        {/* Documents */}
        {documents.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Documents ({documents.length})
            </Text>
            <View style={styles.docGrid}>
              {documents.map((doc, i) => (
                <Image
                  key={i}
                  source={{ uri: doc.uri }}
                  style={styles.docThumb}
                />
              ))}
            </View>
          </View>
        )}

        {/* Fee banner */}
        <View style={styles.feeBanner}>
          <Text style={styles.feeLabel}>Frais de certification</Text>
          <Text style={styles.feeAmount}>3 000 FCFA</Text>
          <Text style={styles.feeNote}>
            Paiement unique pour sécuriser et verrouiller votre dossier.
          </Text>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          onPress={() => router.push('/contract/new/documents')}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: pressed ? colors.greenDark : colors.green },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="attach" size={20} color="white" />
            <Text style={styles.ctaText}>Ajouter des documents</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
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
  scrollContent: { padding: 16, gap: 16, paddingBottom: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 14,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
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
  partyName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  partyRole: { color: colors.muted, fontSize: 12 },
  audioLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  docGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  docThumb: { width: 64, height: 64, borderRadius: 8, backgroundColor: colors.surface2 },
  feeBanner: {
    backgroundColor: 'rgba(245,166,35,0.12)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245,166,35,0.3)',
    gap: 4,
  },
  feeLabel: { color: colors.gold, fontSize: 13, fontWeight: '600' },
  feeAmount: { color: colors.gold, fontSize: 28, fontWeight: '800' },
  feeNote: { color: colors.muted, fontSize: 12, lineHeight: 16, marginTop: 4 },
  ctaBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  cta: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
