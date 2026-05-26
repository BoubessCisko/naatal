import { View, Text, Pressable, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { logout } from '../../lib/auth';

export default function Profile() {
  const profile = useAuthStore((s) => s.profile);
  const clear = useAuthStore((s) => s.clear);

  const handleLogout = async () => {
    Alert.alert('Déconnexion', 'Es-tu sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Déconnecter',
        style: 'destructive',
        onPress: async () => {
          await logout();
          clear();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

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
      <View
        style={{
          backgroundColor: colors.surface,
          padding: 20,
          borderRadius: 14,
          gap: 12,
        }}
      >
        <View>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Téléphone</Text>
          <Text style={{ color: colors.text, fontSize: 16 }}>
            {profile?.phone ?? '—'}
          </Text>
        </View>
        <View
          style={{ height: 1, backgroundColor: colors.surface2 }}
        />
        <View>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Nom complet</Text>
          <Text style={{ color: colors.text, fontSize: 16 }}>
            {profile?.full_name ?? '—'}
          </Text>
        </View>
        <View
          style={{ height: 1, backgroundColor: colors.surface2 }}
        />
        <View>
          <Text style={{ color: colors.muted, fontSize: 12 }}>CNI vérifiée</Text>
          <Text
            style={{
              color: profile?.cni_verified ? colors.green : colors.gold,
              fontSize: 16,
              fontWeight: '600',
            }}
          >
            {profile?.cni_verified ? '✓ Oui' : '✗ Non'}
          </Text>
        </View>
      </View>

      <View style={{ flex: 1 }} />

      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => ({
          backgroundColor: pressed ? '#883a3a' : colors.red,
          paddingVertical: 16,
          borderRadius: 14,
          alignItems: 'center',
          marginBottom: 24,
        })}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
          Se déconnecter
        </Text>
      </Pressable>
    </View>
  );
}
