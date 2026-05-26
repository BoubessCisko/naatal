import { useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { completeKyc, compressImage } from '../../lib/kyc';
import { useAuthStore } from '../../store/authStore';

type Rect = { x: number; y: number; w: number; h: number };

function measureRef(ref: React.RefObject<View | null>): Promise<Rect> {
  return new Promise((resolve) => {
    if (!ref.current) return resolve({ x: 0, y: 0, w: 0, h: 0 });
    ref.current.measureInWindow((x, y, w, h) => resolve({ x, y, w, h }));
  });
}

type Step = 'permission' | 'capture' | 'preview' | 'form' | 'uploading';
type Side = 'recto' | 'verso';

const SIDE_LABEL: Record<Side, string> = {
  recto: 'recto (côté photo)',
  verso: 'verso',
};

export default function Kyc() {
  const [step, setStep] = useState<Step>('permission');
  const [side, setSide] = useState<Side>('recto');
  const [photos, setPhotos] = useState<{ recto?: string; verso?: string }>({});
  const [permission, requestPermission] = useCameraPermissions();
  const [fullName, setFullName] = useState('');
  const [nin, setNin] = useState('');
  const [capturing, setCapturing] = useState(false);

  const cameraRef = useRef<CameraView>(null);
  const cameraBoxRef = useRef<View>(null);
  const frameRef = useRef<View>(null);
  const insets = useSafeAreaInsets();
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const currentPhoto = photos[side];

  const handleRequestPermission = async () => {
    const res = await requestPermission();
    if (res.granted) setStep('capture');
  };

  const handleCapture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      // Mesure le cadre vert ET la zone caméra avant la capture.
      // CameraView contrainte au ratio 3:4 = la zone affichée matche
      // l'aspect ratio du capteur → fractions directement utilisables.
      const [camera, frame] = await Promise.all([
        measureRef(cameraBoxRef),
        measureRef(frameRef),
      ]);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.9,
        base64: false,
      });
      if (!photo?.uri) {
        Alert.alert('Erreur', 'La capture a échoué. Réessayez.');
        return;
      }

      // Fractions de la zone caméra (0..1) — directement appliquées sur la photo
      const fracX = (frame.x - camera.x) / camera.w;
      const fracY = (frame.y - camera.y) / camera.h;
      const fracW = frame.w / camera.w;
      const fracH = frame.h / camera.h;

      const { uri } = await compressImage(photo.uri, {
        fracX,
        fracY,
        fracW,
        fracH,
      });

      setPhotos((p) => ({ ...p, [side]: uri }));
      setStep('preview');
    } catch (e) {
      Alert.alert(
        'Erreur caméra',
        e instanceof Error ? e.message : 'Impossible de capturer la photo.'
      );
    } finally {
      setCapturing(false);
    }
  };

  const handleReshoot = () => {
    setPhotos((p) => ({ ...p, [side]: undefined }));
    setStep('capture');
  };

  const handleValidatePhoto = () => {
    if (side === 'recto') {
      setSide('verso');
      setStep('capture');
    } else {
      setStep('form');
    }
  };

  const handleSubmit = async () => {
    if (!photos.recto || !photos.verso) {
      Alert.alert('Photos manquantes', 'Recto et verso requis.');
      return;
    }
    if (!fullName.trim() || nin.replace(/\D/g, '').length < 10) {
      Alert.alert(
        'Champs incomplets',
        'Nom complet et NIN (au moins 10 chiffres) requis.'
      );
      return;
    }
    setStep('uploading');
    try {
      await completeKyc({
        fullName,
        nin,
        photoRectoUri: photos.recto,
        photoVersoUri: photos.verso,
      });
      await refreshProfile();
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert(
        'Erreur',
        e instanceof Error ? e.message : "Impossible de finaliser la vérification."
      );
      setStep('form');
    }
  };

  // ===== Étape 1 : Permission caméra =====
  if (step === 'permission') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          paddingHorizontal: 24,
          paddingTop: 80,
          paddingBottom: 32,
          gap: 24,
        }}
      >
        <View style={{ gap: 8 }}>
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700' }}>
            Vérifions votre identité
          </Text>
          <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
            On a besoin des deux faces de votre carte d'identité nationale :
            recto (côté photo) puis verso. Les images restent privées et chiffrées.
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={handleRequestPermission}
          style={({ pressed }) => ({
            backgroundColor: pressed ? colors.greenDark : colors.green,
            paddingVertical: 16,
            borderRadius: 14,
            alignItems: 'center',
          })}
        >
          <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
            {permission?.granted ? 'Continuer' : 'Autoriser la caméra'}
          </Text>
        </Pressable>

        {permission && !permission.granted && permission.canAskAgain === false && (
          <Text
            style={{ color: colors.gold, fontSize: 13, textAlign: 'center' }}
          >
            Permission refusée. Active la caméra dans Paramètres → Naatal.
          </Text>
        )}
      </View>
    );
  }

  // ===== Étape 2 : Capture photo =====
  // CameraView contrainte au ratio 3:4 (capteur natif portrait) → ce qui s'affiche
  // = ce qui est dans la photo, mapping 1:1 → crop pixel-précis sans gymnastique.
  if (step === 'capture') {
    return (
      <View style={{ flex: 1, backgroundColor: 'black' }}>
        <View style={{ height: insets.top, backgroundColor: 'black' }} />

        {/* Camera box — ratio 3:4 = aspect natif des capteurs photo back */}
        <View
          ref={cameraBoxRef}
          style={{
            width: '100%',
            aspectRatio: 3 / 4,
            position: 'relative',
          }}
        >
          <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />

          {/* Cadre vert overlay — DANS la zone caméra uniquement */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              ref={frameRef}
              style={{
                width: '92%',
                aspectRatio: 1.585,
                borderWidth: 3,
                borderColor: colors.green,
                borderRadius: 12,
              }}
            />
          </View>
        </View>

        {/* Zone controls en dessous de la caméra */}
        <View
          style={{
            flex: 1,
            backgroundColor: 'black',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 20,
            paddingBottom: insets.bottom + 24,
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: 15,
              fontWeight: '600',
              textAlign: 'center',
            }}
          >
            Placez le {SIDE_LABEL[side]} dans le cadre
          </Text>

          <View style={{ alignItems: 'center', gap: 10 }}>
            <Pressable
              onPress={handleCapture}
              disabled={capturing}
              style={({ pressed }) => ({
                width: 84,
                height: 84,
                borderRadius: 42,
                backgroundColor: capturing ? colors.muted : 'white',
                borderWidth: 6,
                borderColor: pressed ? colors.green : 'rgba(255,255,255,0.4)',
                alignItems: 'center',
                justifyContent: 'center',
              })}
            >
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: 'white',
                }}
              />
            </Pressable>
            <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>
              {capturing ? 'Capture…' : `Capturer le ${side}`}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // ===== Étape 3 : Preview =====
  if (step === 'preview' && currentPhoto) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          paddingHorizontal: 24,
          paddingTop: 60,
          paddingBottom: 32,
          gap: 16,
        }}
      >
        <View style={{ gap: 4 }}>
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            Étape {side === 'recto' ? '1/2' : '2/2'} — {SIDE_LABEL[side]}
          </Text>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '600' }}>
            La photo est-elle nette ?
          </Text>
        </View>
        <Image
          source={{ uri: currentPhoto }}
          style={{
            width: '100%',
            aspectRatio: 1.585,
            borderRadius: 12,
            backgroundColor: colors.surface,
          }}
          resizeMode="contain"
        />
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Pressable
            onPress={handleReshoot}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: pressed ? colors.surface : colors.surface2,
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
            })}
          >
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '600' }}>
              Reprendre
            </Text>
          </Pressable>
          <Pressable
            onPress={handleValidatePhoto}
            style={({ pressed }) => ({
              flex: 1,
              backgroundColor: pressed ? colors.greenDark : colors.green,
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
            })}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              {side === 'recto' ? 'Continuer (verso)' : 'Valider'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  // ===== Étape 4 : Formulaire nom + NIN =====
  if (step === 'form') {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: colors.bg }}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingTop: 60,
            paddingBottom: 32,
            gap: 24,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ gap: 8 }}>
            <Text style={{ color: colors.text, fontSize: 26, fontWeight: '700' }}>
              Vos informations
            </Text>
            <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>
              Tels qu'inscrits sur votre carte d'identité.
            </Text>
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600' }}>
              Nom complet
            </Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Aminata Diop"
              placeholderTextColor={colors.muted}
              autoCapitalize="words"
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 16,
                color: colors.text,
                fontSize: 16,
              }}
            />
          </View>

          <View style={{ gap: 6 }}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600' }}>
              NIN (numéro d'identification nationale)
            </Text>
            <TextInput
              value={nin}
              onChangeText={(v) => setNin(v.replace(/\D/g, '').slice(0, 14))}
              placeholder="1 2345 6789 01234"
              placeholderTextColor={colors.muted}
              keyboardType="number-pad"
              style={{
                backgroundColor: colors.surface,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 16,
                color: colors.text,
                fontSize: 16,
                letterSpacing: 1,
              }}
            />
            <Text style={{ color: colors.muted, fontSize: 11, marginTop: 4 }}>
              Hashé et stocké de manière irréversible. Jamais visible en clair.
            </Text>
          </View>

          {/* Aperçu mini des 2 photos */}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {photos.recto && (
              <Image
                source={{ uri: photos.recto }}
                style={{
                  flex: 1,
                  aspectRatio: 1.585,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.surface2,
                }}
                resizeMode="cover"
              />
            )}
            {photos.verso && (
              <Image
                source={{ uri: photos.verso }}
                style={{
                  flex: 1,
                  aspectRatio: 1.585,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: colors.surface2,
                }}
                resizeMode="cover"
              />
            )}
          </View>

          <View style={{ flex: 1 }} />

          <Pressable
            onPress={handleSubmit}
            style={({ pressed }) => ({
              backgroundColor: pressed ? colors.greenDark : colors.green,
              paddingVertical: 16,
              borderRadius: 14,
              alignItems: 'center',
            })}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              Terminer l'inscription
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ===== Étape 5 : Upload en cours =====
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        gap: 16,
      }}
    >
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '600' }}>
        Finalisation…
      </Text>
      <Text
        style={{
          color: colors.muted,
          fontSize: 14,
          textAlign: 'center',
          lineHeight: 20,
        }}
      >
        Upload de vos 2 photos + hash sécurisé de votre NIN. Quelques secondes.
      </Text>
    </View>
  );
}
