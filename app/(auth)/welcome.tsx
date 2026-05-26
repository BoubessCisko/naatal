import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../constants/colors';

export default function Welcome() {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        paddingHorizontal: 32,
        paddingTop: 120,
        paddingBottom: 48,
        justifyContent: 'space-between',
      }}
    >
      <View style={{ alignItems: 'center', gap: 24 }}>
        <Text style={{ color: colors.green, fontSize: 56, fontWeight: '700' }}>
          Naatal
        </Text>
        <Text
          style={{
            color: colors.text,
            fontSize: 18,
            textAlign: 'center',
            lineHeight: 26,
          }}
        >
          Transformez vos accords{'\n'}en preuves numériques.
        </Text>
        <Text
          style={{
            color: colors.muted,
            fontSize: 14,
            textAlign: 'center',
            marginTop: 16,
          }}
        >
          Enregistrez. Validez. Verrouillez.{'\n'}En moins de 2 minutes.
        </Text>
      </View>

      <Pressable
        onPress={() => router.push('/(auth)/login')}
        style={({ pressed }) => ({
          backgroundColor: pressed ? colors.greenDark : colors.green,
          paddingVertical: 16,
          borderRadius: 14,
          alignItems: 'center',
        })}
      >
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
          Commencer
        </Text>
      </Pressable>
    </View>
  );
}
