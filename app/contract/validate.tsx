import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../constants/colors';
import {
  account,
  databases,
  DB_ID,
  COLLECTIONS,
  Query,
} from '../../lib/appwrite';

export default function ValidateContract() {
  const { contractId } = useLocalSearchParams<{ contractId: string }>();
  const insets = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [step, setStep] = useState<'send' | 'verify' | 'done'>('send');
  const [tokenUserId, setTokenUserId] = useState('');
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async () => {
    setSending(true);
    try {
      const me = await account.get();
      const token = await account.createPhoneToken(me.$id, me.phone);
      setTokenUserId(token.userId);
      setStep('verify');
      setCountdown(60);
    } catch (e) {
      Alert.alert(
        'Erreur',
        e instanceof Error ? e.message : "Impossible d'envoyer le code."
      );
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (finalCode: string) => {
    if (finalCode.length !== 6 || loading) return;
    setLoading(true);
    try {
      await account.createSession(tokenUserId, finalCode);

      // Mark this party as validated
      const me = await account.get();
      const partyRes = await databases.listDocuments(DB_ID, COLLECTIONS.parties, [
        Query.equal('contract_id', contractId),
        Query.equal('user_id', me.$id),
        Query.limit(1),
      ]);

      if (partyRes.documents.length > 0) {
        await databases.updateDocument(
          DB_ID,
          COLLECTIONS.parties,
          partyRes.documents[0].$id,
          {
            has_validated: true,
            validated_at: new Date().toISOString(),
            otp_verified: true,
          }
        );
      }

      // Check if all parties have validated
      const allParties = await databases.listDocuments(DB_ID, COLLECTIONS.parties, [
        Query.equal('contract_id', contractId),
        Query.limit(10),
      ]);
      const allValidated = allParties.documents.every(
        (p: any) => p.has_validated === true
      );

      if (allValidated) {
        await databases.updateDocument(
          DB_ID,
          COLLECTIONS.contracts,
          contractId,
          { status: 'active' }
        );
      }

      setStep('done');
    } catch (e) {
      Alert.alert(
        'Code invalide',
        e instanceof Error ? e.message : 'Vérifiez le code et réessayez.'
      );
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (v: string) => {
    const cleaned = v.replace(/\D/g, '').slice(0, 6);
    setCode(cleaned);
    if (cleaned.length === 6) handleVerify(cleaned);
  };

  if (step === 'done') {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <View style={styles.successBadge}>
          <Ionicons name="checkmark-circle" size={48} color={colors.green} />
        </View>
        <Text style={styles.successTitle}>Validation confirmée !</Text>
        <Text style={styles.successSub}>
          Votre signature OTP a été enregistrée.
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: pressed ? colors.greenDark : colors.green,
              marginTop: 32,
              width: '80%',
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="arrow-back" size={20} color="white" />
            <Text style={styles.ctaText}>Retour au contrat</Text>
          </View>
        </Pressable>
      </View>
    );
  }

  if (step === 'send') {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Valider le contrat</Text>
        </View>

        <View style={styles.content}>
          <View style={{ gap: 8 }}>
            <Text style={styles.title}>Signature OTP</Text>
            <Text style={styles.subtitle}>
              Pour valider cet accord, nous allons vous envoyer un code par SMS.
              Ce code prouve votre consentement.
            </Text>
          </View>

          <View style={{ flex: 1 }} />

          <Pressable
            onPress={handleSendOtp}
            disabled={sending}
            style={({ pressed }) => [
              styles.cta,
              {
                backgroundColor: sending
                  ? colors.surface2
                  : pressed
                    ? colors.greenDark
                    : colors.green,
              },
            ]}
          >
            {sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="send" size={18} color="white" />
                <Text style={styles.ctaText}>Envoyer le code</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    );
  }

  // step === 'verify'
  const boxes = Array.from({ length: 6 }, (_, i) => code[i] ?? '');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Code de vérification</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Entrez le code à 6 chiffres reçu par SMS.
        </Text>

        <Pressable onPress={() => inputRef.current?.focus()}>
          <View style={styles.boxRow}>
            {boxes.map((digit, i) => (
              <View
                key={i}
                style={[
                  styles.box,
                  {
                    borderColor:
                      code.length === i ? colors.green : 'transparent',
                  },
                ]}
              >
                <Text style={styles.boxDigit}>{digit}</Text>
              </View>
            ))}
          </View>
        </Pressable>

        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }}
        />

        <View style={{ flex: 1 }} />

        <View style={{ alignItems: 'center', gap: 12 }}>
          {countdown > 0 ? (
            <Text style={{ color: colors.muted, fontSize: 14 }}>
              Renvoyer dans {countdown}s
            </Text>
          ) : (
            <Pressable onPress={handleSendOtp}>
              <Text style={{ color: colors.green, fontSize: 14, fontWeight: '600' }}>
                Renvoyer le code
              </Text>
            </Pressable>
          )}
          {loading && (
            <Text style={{ color: colors.muted, fontSize: 14 }}>
              Vérification…
            </Text>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: colors.surface, gap: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '600' as const },
  content: { flex: 1, padding: 24, gap: 24 },
  title: { color: colors.text, fontSize: 26, fontWeight: '700' },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  boxRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  box: {
    flex: 1, aspectRatio: 1, backgroundColor: colors.surface,
    borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center',
  },
  boxDigit: { color: colors.text, fontSize: 24, fontWeight: '600' },
  cta: { paddingVertical: 16, borderRadius: 14, alignItems: 'center' },
  ctaText: { color: 'white', fontSize: 16, fontWeight: '600' },
  successBadge: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(0,168,132,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { color: colors.text, fontSize: 26, fontWeight: '700', marginTop: 20 },
  successSub: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: 8 },
});
