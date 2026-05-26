import { View, Text, Pressable } from 'react-native';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';

export default function Home() {
  const profile = useAuthStore((s) => s.profile);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingHorizontal: 24,
        paddingTop: 32,
        gap: 24,
      }}
    >
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.muted, fontSize: 14 }}>
          Bonjour
        </Text>
        <Text style={{ color: colors.text, fontSize: 24, fontWeight: '700' }}>
          {profile?.full_name ?? profile?.phone ?? 'Utilisateur'}
        </Text>
      </View>

      <View
        style={{
          backgroundColor: colors.surface,
          padding: 20,
          borderRadius: 14,
          gap: 8,
        }}
      >
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
          Aucun contrat pour le moment
        </Text>
        <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
          Phase 3 (Création de contrat) arrive bientôt. Tu pourras créer ton
          premier contrat à partir d'ici.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <Pressable
        disabled
        style={{
          backgroundColor: colors.surface2,
          paddingVertical: 16,
          borderRadius: 14,
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <Text style={{ color: colors.muted, fontSize: 16, fontWeight: '600' }}>
          + Nouveau contrat (Phase 3)
        </Text>
      </Pressable>
    </View>
  );
}
