import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
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
        <View
          style={{
            width: 88,
            height: 88,
            borderRadius: 24,
            backgroundColor: 'rgba(0,168,132,0.15)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="shield-checkmark" size={44} color={colors.green} />
        </View>
        <Text style={{ color: colors.green, fontSize: 48, fontWeight: '800' }}>
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
            marginTop: 8,
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
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        })}
      >
        <Ionicons name="arrow-forward-circle" size={22} color="white" />
        <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
          Commencer
        </Text>
      </Pressable>
    </View>
  );
}
