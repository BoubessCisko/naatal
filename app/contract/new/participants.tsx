import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../../constants/colors';
import { useContractStore } from '../../../store/contractStore';
import { useAuthStore } from '../../../store/authStore';
import {
  account,
  databases,
  ID,
  Permission,
  Role,
  DB_ID,
  COLLECTIONS,
} from '../../../lib/appwrite';

function generateReference(): string {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NTL-${date}-${rand}`;
}

export default function Participants() {
  const insets = useSafeAreaInsets();
  const profile = useAuthStore((s) => s.profile);
  const { type, setContractId, setParties } = useContractStore();

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const digits = phone.replace(/\D/g, '');
  const isValid = digits.length === 9;

  const myPhone = profile?.phone ?? '';
  const myName = profile?.full_name ?? 'Vous';

  const handleContinue = async () => {
    if (!isValid) {
      Alert.alert('Numéro invalide', 'Entrez un numéro sénégalais à 9 chiffres.');
      return;
    }
    const partyPhone = `+221${digits}`;
    if (partyPhone === myPhone) {
      Alert.alert('Erreur', 'Vous ne pouvez pas vous ajouter comme deuxième partie.');
      return;
    }

    setCreating(true);
    try {
      const me = await account.get();
      const reference = generateReference();

      // Create contract in Appwrite immediately
      const contract = await databases.createDocument(
        DB_ID,
        COLLECTIONS.contracts,
        ID.unique(),
        {
          reference,
          type: type ?? 'pret',
          status: 'draft',
          amount: null,
          currency: 'FCFA',
          due_date: null,
          summary: '{}',
          integrity_hash: null,
          created_by: me.$id,
          locked_at: null,
        },
        [
          Permission.read(Role.user(me.$id)),
          Permission.update(Role.user(me.$id)),
        ]
      );

      // Create initiator party
      await databases.createDocument(
        DB_ID,
        COLLECTIONS.parties,
        ID.unique(),
        {
          contract_id: contract.$id,
          user_id: me.$id,
          role: 'initiateur',
          has_validated: false,
          validated_at: null,
          otp_verified: false,
        },
        [
          Permission.read(Role.user(me.$id)),
          Permission.update(Role.user(me.$id)),
        ]
      );

      // Create party 2 entry (user_id empty until they join)
      await databases.createDocument(
        DB_ID,
        COLLECTIONS.parties,
        ID.unique(),
        {
          contract_id: contract.$id,
          user_id: '',
          role: 'partie',
          has_validated: false,
          validated_at: null,
          otp_verified: false,
        },
        [
          Permission.read(Role.user(me.$id)),
          Permission.update(Role.user(me.$id)),
        ]
      );

      // Update local store
      setContractId(contract.$id);
      setParties([
        { phone: myPhone, role: 'initiateur', name: myName },
        { phone: partyPhone, role: 'partie', name: name.trim() || undefined },
      ]);

      router.push('/contract/new/invite');
    } catch (e) {
      Alert.alert(
        'Erreur',
        e instanceof Error ? e.message : 'Impossible de créer le contrat.'
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.root, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Participants</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Initiateur (vous)</Text>
          <View style={styles.partyCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {myName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.partyName}>{myName}</Text>
              <Text style={styles.partyPhone}>{myPhone}</Text>
            </View>
            <View style={styles.checkBadge}>
              <Text style={{ color: colors.green, fontSize: 12 }}>✓</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Deuxième partie</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nom (optionnel)</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Nom de la personne"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              style={styles.input}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Numéro de téléphone</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.prefix}>+221</Text>
              <View style={styles.divider} />
              <TextInput
                value={phone}
                onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 9))}
                placeholder="77 123 45 67"
                placeholderTextColor={colors.muted}
                keyboardType="phone-pad"
                style={styles.phoneInput}
              />
            </View>
          </View>

          <Text style={styles.hint}>
            Un SMS d'invitation sera envoyé à ce numéro.
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={handleContinue}
          disabled={!isValid || creating}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: !isValid || creating
                ? colors.surface2
                : pressed
                  ? colors.greenDark
                  : colors.green,
            },
          ]}
        >
          {creating ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="send" size={18} color={!isValid || creating ? colors.muted : 'white'} />
              <Text
                style={[styles.ctaText, { color: !isValid || creating ? colors.muted : 'white' }]}
              >
                Créer et inviter
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
  content: { flex: 1, padding: 24, gap: 24 },
  section: { gap: 12 },
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  partyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: 'white', fontSize: 18, fontWeight: '700' },
  partyName: { color: colors.text, fontSize: 15, fontWeight: '600' },
  partyPhone: { color: colors.muted, fontSize: 13 },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,168,132,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputGroup: { gap: 6 },
  inputLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: colors.text,
    fontSize: 15,
  },
  phoneRow: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
  },
  prefix: { color: colors.text, fontSize: 16, fontWeight: '600' },
  divider: { width: 1, height: 24, backgroundColor: colors.surface2 },
  phoneInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    paddingVertical: 14,
    letterSpacing: 1,
  },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 16 },
  cta: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  ctaText: { fontSize: 16, fontWeight: '600' },
});
