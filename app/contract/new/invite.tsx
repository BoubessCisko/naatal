import { View, Text, Pressable, Share, Linking, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../../constants/colors';
import { useContractStore } from '../../../store/contractStore';

const TYPE_LABELS: Record<string, string> = {
  vente: 'une vente',
  pret: 'un prêt',
  service: 'un service',
  location: 'une location',
};

const EXPO_GO_PLAY_STORE = 'https://play.google.com/store/apps/details?id=host.exp.exponent';

export default function Invite() {
  const insets = useSafeAreaInsets();
  const { contractId, type, parties } = useContractStore();

  const party1Name = parties[0]?.name ?? 'Quelqu\'un';
  const party2Phone = parties[1]?.phone ?? '';
  const party2Name = parties[1]?.name ?? party2Phone;

  const joinLink = `naatal://join?contractId=${contractId}`;

  const inviteMessage =
    `${party1Name} vous invite à sécuriser un accord (${TYPE_LABELS[type ?? ''] ?? 'un accord'}) sur Naatal.\n\n` +
    `📱 Pour participer :\n` +
    `1. Installez "Expo Go" depuis le Play Store :\n${EXPO_GO_PLAY_STORE}\n\n` +
    `2. Ouvrez l'app Naatal et connectez-vous avec votre numéro ${party2Phone}\n\n` +
    `3. Le contrat apparaîtra automatiquement dans votre liste.\n\n` +
    `Référence du contrat : ${contractId}\n\n` +
    `Naatal — Vos accords, votre preuve.`;

  const shareVia = async (method: 'whatsapp' | 'sms' | 'generic') => {
    if (method === 'whatsapp') {
      const url = `whatsapp://send?phone=${party2Phone.replace('+', '')}&text=${encodeURIComponent(inviteMessage)}`;
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
          return;
        }
      } catch {}
    }

    if (method === 'sms') {
      const url = `sms:${party2Phone}?body=${encodeURIComponent(inviteMessage)}`;
      try {
        await Linking.openURL(url);
        return;
      } catch {}
    }

    await Share.share({ message: inviteMessage });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Inviter {party2Name}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          L'autre partie doit installer l'app et se connecter avec son numéro
          pour participer à l'enregistrement vocal.
        </Text>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <View style={styles.qrBox}>
            <QRCode
              value={joinLink}
              size={160}
              backgroundColor="white"
              color={colors.bg}
            />
          </View>
          <Text style={styles.qrHint}>
            Scannez pour rejoindre le contrat
          </Text>
        </View>

        {/* Share buttons */}
        <View style={styles.shareSection}>
          <Text style={styles.shareLabel}>Envoyer l'invitation :</Text>

          <Pressable
            onPress={() => shareVia('whatsapp')}
            style={({ pressed }) => [
              styles.shareButton,
              styles.whatsappBtn,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.shareBtnText}>WhatsApp</Text>
          </Pressable>

          <Pressable
            onPress={() => shareVia('sms')}
            style={({ pressed }) => [
              styles.shareButton,
              styles.smsBtn,
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.shareBtnText}>SMS</Text>
          </Pressable>

          <Pressable
            onPress={() => shareVia('generic')}
            style={({ pressed }) => [
              styles.shareButton,
              { backgroundColor: colors.surface },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Text style={styles.shareBtnText}>Autre</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        {/* Go to voice recording (initiator can start, party 2 joins later) */}
        <Pressable
          onPress={() => router.push({
            pathname: '/contract/[id]/voice',
            params: { id: contractId! },
          })}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: pressed ? colors.greenDark : colors.green },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="mic" size={20} color="white" />
            <Text style={styles.ctaText}>Commencer l'enregistrement</Text>
          </View>
        </Pressable>
        <Text style={styles.waitHint}>
          L'autre partie pourra rejoindre en temps réel depuis son téléphone.
        </Text>
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
  content: { flex: 1, padding: 24, gap: 20 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  qrContainer: { alignItems: 'center', gap: 10 },
  qrBox: { backgroundColor: 'white', borderRadius: 20, padding: 16 },
  qrHint: { color: colors.muted, fontSize: 12 },
  shareSection: { gap: 10 },
  shareLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  whatsappBtn: { backgroundColor: '#1a5c42' },
  smsBtn: { backgroundColor: '#2a3942' },
  shareBtnText: { color: colors.text, fontSize: 15, fontWeight: '600' },
  cta: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: { color: 'white', fontSize: 16, fontWeight: '600' },
  waitHint: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
});
