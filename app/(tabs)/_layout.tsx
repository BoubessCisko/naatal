import { Tabs } from 'expo-router';
import { colors } from '../../constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surface2,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.green,
        tabBarInactiveTintColor: colors.muted,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Accueil', headerTitle: 'Naatal' }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', headerTitle: 'Profil' }}
      />
    </Tabs>
  );
}
