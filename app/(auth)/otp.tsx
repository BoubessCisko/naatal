import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors } from '../../constants/colors';
import { verifyOtp } from '../../lib/auth';
import { useAuthStore } from '../../store/authStore';

const USE_REAL_OTP = process.env.EXPO_PUBLIC_USE_REAL_OTP === 'true';

export default function Otp() {
  const { userId, phone, secret } = useLocalSearchParams<{
    userId: string;
    phone: string;
    secret?: string;
  }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRef = useRef<TextInput>(null);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const autoVerified = useRef(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleVerify = async (finalCode: string, devSecret?: string) => {
    if (loading) return;
    setLoading(true);
    try {
      await verifyOtp(userId, finalCode, phone, devSecret);
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

  // Dev mode: auto-verify with the server-provided secret
  useEffect(() => {
    if (!USE_REAL_OTP && secret && !autoVerified.current) {
      autoVerified.current = true;
      handleVerify('', secret);
    }
  }, [secret]);

  const handleChange = (v: string) => {
    const cleaned = v.replace(/\D/g, '').slice(0, 6);
    setCode(cleaned);
    if (cleaned.length === 6) handleVerify(cleaned);
  };

  // Dev mode: show loading while auto-verifying
  if (!USE_REAL_OTP && secret && loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
        }}
      >
        <ActivityIndicator size="large" color={colors.green} />
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
          Connexion en cours…
        </Text>
      </View>
    );
  }

  // Real OTP mode: show the 6-digit input
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
