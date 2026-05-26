import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { colors } from '../../constants/colors';
import { sendOtp } from '../../lib/auth';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  // Validation : 9 chiffres après +221 (formats sénégalais 7X XXX XX XX)
  const digits = phone.replace(/\D/g, '');
  const isValid = digits.length === 9;

  const handleSubmit = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      const fullPhone = `+221${digits}`;
      const { userId } = await sendOtp(fullPhone);
      router.push({
        pathname: '/(auth)/otp',
        params: { userId, phone: fullPhone },
      });
    } catch (e) {
      Alert.alert(
        'Erreur',
        e instanceof Error ? e.message : "Impossible d'envoyer le code. Réessayez."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 80,
          paddingBottom: 32,
          gap: 32,
        }}
      >
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700' }}>
            Votre numéro
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
            Nous vous enverrons un code à 6 chiffres par SMS pour vérifier votre
            identité.
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.surface,
            borderRadius: 14,
            paddingHorizontal: 16,
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>
            +221
          </Text>
          <View
            style={{ width: 1, height: 24, backgroundColor: colors.surface2 }}
          />
          <TextInput
            value={phone}
            onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 9))}
            placeholder="77 123 45 67"
            placeholderTextColor={colors.muted}
            keyboardType="phone-pad"
            autoFocus
            style={{
              flex: 1,
              color: colors.text,
              fontSize: 18,
              paddingVertical: 18,
              letterSpacing: 1,
            }}
          />
        </View>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={handleSubmit}
          disabled={!isValid || loading}
          style={({ pressed }) => ({
            backgroundColor:
              !isValid || loading
                ? colors.surface2
                : pressed
                ? colors.greenDark
                : colors.green,
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
          })}
        >
          <Text
            style={{
              color: !isValid || loading ? colors.muted : 'white',
              fontSize: 16,
              fontWeight: '600',
            }}
          >
            {loading ? 'Envoi…' : 'Continuer'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
