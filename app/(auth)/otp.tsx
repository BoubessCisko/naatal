import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../constants/colors';
import { verifyOtp, DEV_OTP_CODE } from '../../lib/auth';
import { useAuthStore } from '../../store/authStore';

const USE_REAL_OTP = process.env.EXPO_PUBLIC_USE_REAL_OTP === 'true';

export default function Otp() {
  const { userId, phone } = useLocalSearchParams<{
    userId: string;
    phone: string;
  }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRef = useRef<TextInput>(null);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerify = async (finalCode: string) => {
    if (finalCode.length !== 6 || loading) return;
    setLoading(true);
    try {
      await verifyOtp(userId, finalCode, phone);
      await refreshProfile();
      router.replace('/(auth)/kyc');
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

  const boxes = Array.from({ length: 6 }, (_, i) => code[i] ?? '');

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
            Code de vérification
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
            Code envoyé au {phone}.
          </Text>
          {!USE_REAL_OTP && (
            <Text
              style={{
                color: colors.gold,
                fontSize: 13,
                marginTop: 8,
                fontWeight: '600',
              }}
            >
              Mode dev : utilisez le code {DEV_OTP_CODE}
            </Text>
          )}
        </View>

        <Pressable onPress={() => inputRef.current?.focus()}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 8,
            }}
          >
            {boxes.map((digit, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  aspectRatio: 1,
                  backgroundColor: colors.surface,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor:
                    code.length === i ? colors.green : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{ color: colors.text, fontSize: 24, fontWeight: '600' }}
                >
                  {digit}
                </Text>
              </View>
            ))}
          </View>
        </Pressable>

        {/* Input invisible qui capture la saisie */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={handleChange}
          keyboardType="number-pad"
          maxLength={6}
          autoFocus
          style={{
            position: 'absolute',
            opacity: 0,
            width: 1,
            height: 1,
          }}
        />

        <View style={{ flex: 1 }} />

        <View style={{ alignItems: 'center', gap: 12 }}>
          {countdown > 0 ? (
            <Text style={{ color: colors.muted, fontSize: 14 }}>
              Renvoyer le code dans {countdown}s
            </Text>
          ) : (
            <Pressable
              onPress={() => {
                setCountdown(60);
                Alert.alert('Code renvoyé', 'Vérifiez vos SMS.');
              }}
            >
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
