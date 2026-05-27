import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  FlatList,
  Alert,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../../constants/colors';
import { useContractStore } from '../../../store/contractStore';

export default function Documents() {
  const insets = useSafeAreaInsets();
  const documents = useContractStore((s) => s.documents);
  const addDocument = useContractStore((s) => s.addDocument);
  const removeDocument = useContractStore((s) => s.removeDocument);

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });
    if (result.canceled) return;
    for (const asset of result.assets) {
      addDocument({
        uri: asset.uri,
        name: asset.fileName ?? `photo-${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
    }
  };

  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission requise', 'Autorisez la caméra dans les paramètres.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    addDocument({
      uri: asset.uri,
      name: asset.fileName ?? `photo-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
    });
  };

  const handleRemove = (uri: string) => {
    Alert.alert('Supprimer ?', 'Retirer ce document du dossier ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => removeDocument(uri) },
    ]);
  };

  const renderItem = ({ item, index }: { item: typeof documents[0]; index: number }) => (
    <View style={styles.docItem}>
      <Image source={{ uri: item.uri }} style={styles.docThumb} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.docName} numberOfLines={1}>
          Document {index + 1}
        </Text>
        <Text style={styles.docType}>
          {item.mimeType.includes('pdf') ? 'PDF' : 'Photo'}
        </Text>
      </View>
      <Pressable
        onPress={() => handleRemove(item.uri)}
        style={styles.removeButton}
      >
        <Text style={styles.removeText}>✕</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Documents justificatifs</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Ajoutez des photos ou documents pour renforcer votre dossier :
          reçus, bons, photos du bien, accords écrits…
        </Text>

        {/* Add buttons */}
        <View style={styles.addRow}>
          <Pressable
            onPress={takePhoto}
            style={({ pressed }) => [
              styles.addCard,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.addIcon}>📷</Text>
            <Text style={styles.addLabel}>Prendre une photo</Text>
          </Pressable>

          <Pressable
            onPress={pickFromGallery}
            style={({ pressed }) => [
              styles.addCard,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.addIcon}>🖼️</Text>
            <Text style={styles.addLabel}>Depuis la galerie</Text>
          </Pressable>
        </View>

        {/* Document list */}
        {documents.length > 0 ? (
          <FlatList
            data={documents}
            keyExtractor={(item) => item.uri}
            renderItem={renderItem}
            style={{ flex: 1 }}
            contentContainerStyle={{ gap: 8 }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📎</Text>
            <Text style={styles.emptyText}>Aucun document ajouté</Text>
            <Text style={styles.emptyHint}>
              Cette étape est optionnelle mais recommandée.
            </Text>
          </View>
        )}

        {/* Counter */}
        {documents.length > 0 && (
          <Text style={styles.counter}>
            {documents.length} document{documents.length > 1 ? 's' : ''} ajouté{documents.length > 1 ? 's' : ''}
          </Text>
        )}

        <Pressable
          onPress={() => router.push('/contract/new/payment')}
          style={({ pressed }) => [
            styles.cta,
            { backgroundColor: pressed ? colors.greenDark : colors.green },
          ]}
        >
          <Text style={styles.ctaText}>
            {documents.length > 0 ? 'Continuer' : 'Passer cette étape'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
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
  backText: { color: colors.text, fontSize: 18 },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '600' },
  content: { flex: 1, padding: 24, gap: 20 },
  subtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  addRow: { flexDirection: 'row', gap: 12 },
  addCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.surface2,
    borderStyle: 'dashed',
  },
  addIcon: { fontSize: 28 },
  addLabel: { color: colors.text, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 10,
    gap: 12,
  },
  docThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: colors.surface2,
  },
  docName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  docType: { color: colors.muted, fontSize: 12 },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,107,107,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: colors.red, fontSize: 14, fontWeight: '700' },
  separator: { height: 4 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: colors.text, fontSize: 16, fontWeight: '600' },
  emptyHint: { color: colors.muted, fontSize: 13 },
  counter: { color: colors.muted, fontSize: 13, textAlign: 'center' },
  cta: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  ctaText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
