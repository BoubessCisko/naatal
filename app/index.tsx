import { View } from 'react-native';
import { colors } from '../constants/colors';

// Écran initial vide — le RootLayout (_layout.tsx) redirige automatiquement
// vers (auth)/welcome ou (tabs) selon l'état de la session.
export default function Index() {
  return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
}
