import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { useAuthStore } from '../../store/authStore';
import { useContractStore } from '../../store/contractStore';
import { databases, DB_ID, COLLECTIONS, Query } from '../../lib/appwrite';
import type { ContractDoc } from '../../types';

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Brouillon', color: colors.muted, bg: 'rgba(134,150,160,0.2)' },
  pending: { label: 'En attente', color: colors.gold, bg: 'rgba(245,166,35,0.2)' },
  active: { label: 'Actif', color: colors.green, bg: 'rgba(0,168,132,0.2)' },
  locked: { label: 'Verrouillé', color: colors.green, bg: 'rgba(0,168,132,0.2)' },
};

const TYPE_ICONS: Record<string, string> = {
  vente: '🛒',
  pret: '💰',
  service: '🔧',
  location: '🏠',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function Home() {
  const profile = useAuthStore((s) => s.profile);
  const resetContract = useContractStore((s) => s.reset);
  const insets = useSafeAreaInsets();
  const [contracts, setContracts] = useState<ContractDoc[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(false);

  const fetchContracts = useCallback(async () => {
    setError(false);
    try {
      const res = await databases.listDocuments(DB_ID, COLLECTIONS.contracts, [
        Query.orderDesc('$createdAt'),
        Query.limit(50),
      ]);
      setContracts(res.documents as unknown as ContractDoc[]);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchContracts();
    setRefreshing(false);
  }, [fetchContracts]);

  const handleNewContract = () => {
    resetContract();
    router.push('/contract/new/type');
  };

  const renderItem = ({ item }: { item: ContractDoc }) => {
    const badge = STATUS_LABELS[item.status] ?? STATUS_LABELS.draft;
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/contract/[id]', params: { id: item.$id } })}
        style={styles.contractItem}
      >
        <View style={styles.contractIcon}>
          <Text style={{ fontSize: 22 }}>{TYPE_ICONS[item.type] ?? '📄'}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.contractRef}>{item.reference}</Text>
          <Text style={styles.contractType}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            {item.amount ? ` · ${item.amount.toLocaleString()} ${item.currency}` : ''}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.color }]}>
              {badge.label}
            </Text>
          </View>
          <Text style={styles.contractDate}>
            {formatDate(item.$createdAt)}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.greeting}>Bonjour</Text>
          <Text style={styles.name}>
            {profile?.full_name ?? profile?.phone ?? 'Utilisateur'}
          </Text>
        </View>
      </View>

      {error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Impossible de charger vos contrats</Text>
          <Text style={styles.emptyText}>
            Vérifiez votre connexion et réessayez.
          </Text>
          <Pressable
            onPress={fetchContracts}
            style={{ marginTop: 16, paddingVertical: 10, paddingHorizontal: 24, backgroundColor: colors.surface, borderRadius: 12 }}
          >
            <Text style={{ color: colors.green, fontWeight: '600' }}>Réessayer</Text>
          </Pressable>
        </View>
      ) : contracts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={{ fontSize: 48 }}>📋</Text>
          <Text style={styles.emptyTitle}>Aucun contrat</Text>
          <Text style={styles.emptyText}>
            Créez votre premier accord sécurisé en appuyant sur le bouton +
            ci-dessous.
          </Text>
        </View>
      ) : (
        <FlatList
          data={contracts}
          keyExtractor={(item) => item.$id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.green}
              colors={[colors.green]}
            />
          }
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={handleNewContract}
        style={({ pressed }) => [
          styles.fab,
          {
            bottom: insets.bottom + 24,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <Text style={styles.fabIcon}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  greeting: { color: colors.muted, fontSize: 14 },
  name: { color: colors.text, fontSize: 24, fontWeight: '700' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '600' },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: { padding: 16 },
  contractItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  contractIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contractRef: { color: colors.text, fontSize: 14, fontWeight: '600' },
  contractType: { color: colors.muted, fontSize: 12 },
  contractDate: { color: colors.muted, fontSize: 11 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.04)' },
  fab: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  fabIcon: { color: 'white', fontSize: 28, fontWeight: '400' },
});
