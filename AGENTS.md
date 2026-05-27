# Règles absolues avant de coder

## Connaître la stack AVANT d'écrire du code

Tu DOIS lire la documentation officielle de chaque technologie de la stack AVANT de proposer une solution. Ne jamais deviner, ne jamais "patcher" à l'aveugle.

### Documentation à consulter :
- **Expo SDK 56** : https://docs.expo.dev/versions/v56.0.0/
- **expo-audio** : https://docs.expo.dev/versions/v56.0.0/sdk/audio/
- **expo-camera** : https://docs.expo.dev/versions/v56.0.0/sdk/camera/
- **expo-file-system** : https://docs.expo.dev/versions/v56.0.0/sdk/filesystem/
- **expo-image-picker** : https://docs.expo.dev/versions/v56.0.0/sdk/imagepicker/
- **expo-print** : https://docs.expo.dev/versions/v56.0.0/sdk/print/
- **expo-router** : https://docs.expo.dev/versions/v56.0.0/sdk/router/
- **react-native-appwrite** : https://appwrite.io/docs/sdks#reactNative + code source GitHub https://github.com/appwrite/sdk-for-react-native
- **Appwrite Cloud** : https://appwrite.io/docs (Auth, Databases, Storage, Functions, Realtime)
- **NativeWind v4** : https://www.nativewind.dev/v4/overview

### Règles :
1. **Ne jamais deviner le comportement d'une API** — lis la doc ou le code source du SDK
2. **Quand un upload/réseau échoue** — vérifie d'abord comment le SDK gère ce cas en interne (lis le source)
3. **Ne jamais contourner le SDK** sauf si tu as PROUVÉ que le SDK a un bug documenté (issue GitHub)
4. **Quand tu hésites entre deux approches** — vérifie laquelle est dans la doc officielle
5. **Pas de patching en série** — si un fix ne marche pas, prends du recul et cherche la cause racine dans la documentation
