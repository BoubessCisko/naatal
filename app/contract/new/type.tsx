import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '../../../constants/colors';
import { useContractStore } from '../../../store/contractStore';
import type { ContractType } from '../../../types';

const TYPES: { key: ContractType; label: string; icon: string; desc: string }[] = [
  { key: 'vente', label: 'Vente', icon: '🛒', desc: 'Achat ou vente d\'un bien' },
  { key: 'pret', label: 'Prêt', icon: '💰', desc: 'Prêt d\'argent entre particuliers' },
  { key: 'service', label: 'Service', icon: '🔧', desc: 'Prestation de service convenue' },
  { key: 'location', label: 'Location', icon: '🏠', desc: 'Location d\'un bien ou logement' },
];

export default function ContractType() {
  const [selected, setSelected] = useState<ContractType | null>(null);
  const setType = useContractStore((s) => s.setType);
  const insets = useSafeAreaInsets();

  const handleContinue = () => {
    if (!selected) return;
    setType(selected);
    router.push('/contract/new/participants');
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Type de contrat</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>Quel type d'accord souhaitez-vous créer ?</Text>

        <View style={styles.grid}>
          {TYPES.map((t) => (
            <Pressable
              key={t.key}
              onPress={() => setSelected(t.key)}
              style={[
                styles.card,
                selected === t.key && styles.cardSelected,
              ]}
            >
              <Text style={styles.cardIcon}>{t.icon}</Text>
              <Text style={styles.cardLabel}>{t.label}</Text>
              <Text style={styles.cardDesc}>{t.desc}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={handleContinue}
          disabled={!selected}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: !selected
                ? colors.surface2
                : pressed
                  ? colors.greenDark
                  : colors.green,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="arrow-forward" size={20} color={!selected ? colors.muted : 'white'} />
            <Text
              style={[
                styles.ctaText,
                { color: !selected ? colors.muted : 'white' },
              ]}
            >
              Continuer
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
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
  backText: {
    color: colors.text,
    fontSize: 18,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 24,
    gap: 20,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  card: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: colors.green,
    backgroundColor: 'rgba(0,168,132,0.1)',
  },
  cardIcon: {
    fontSize: 32,
  },
  cardLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cardDesc: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 16,
  },
  cta: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
