# SAGARD Mobile

Application mobile pour les agents de terrain et contrôleurs SAGARD.

## Stack

- **React Native** + **Expo** (SDK 51)
- **TypeScript**
- **expo-router** (navigation file-based)
- **NativeWind** (TailwindCSS pour React Native)
- **expo-camera** (photos de pointage)
- **expo-location** (GPS au check-in/check-out)
- **expo-secure-store** (stockage sécurisé du token JWT)
- **lucide-react-native** (icônes)
- **axios** (appels API)

## Structure

```
sagard-mobile/
├── app/                        # Écrans (expo-router)
│   ├── _layout.tsx             # Layout racine (AuthProvider + Stack)
│   ├── index.tsx               # Redirection auth/tabs
│   ├── (auth)/
│   │   └── login.tsx           # Écran de connexion
│   └── (tabs)/
│       ├── _layout.tsx         # Tab bar (4 onglets)
│       ├── pointage.tsx        # Pointage check-in/check-out avec photo + GPS
│       ├── affectations.tsx    # Affectations/sites de l'agent
│       ├── paie.tsx            # Fiches de paie personnelles
│       └── profil.tsx          # Profil + déconnexion
├── components/                 # Composants réutilisables
│   ├── Button.tsx
│   └── UI.tsx                  # LoadingScreen, ErrorView, EmptyView
├── lib/
│   ├── api.ts                  # Instance axios + SecureStore
│   └── auth-context.tsx        # Context d'authentification
├── services/
│   ├── auth.service.ts         # login, getMe
│   └── pointage.service.ts     # checkIn, checkOut, getToday, getDeployments, getPayslips
├── app.json                    # Config Expo
├── babel.config.js             # Babel + NativeWind
├── tailwind.config.js          # Tailwind avec couleurs SAGARD
└── package.json
```

## Installation

```bash
cd sagard-mobile
npm install
npx expo start
```

## Développement

- **Scanner QR** avec l'app Expo Go sur Android/iOS
- **Android** : `npx expo start --android`
- **iOS** : `npx expo start --ios`
- **Web** : `npx expo start --web`

## Build APK

```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview
```

## API

L'app se connecte au backend SAGARD :
- **Production** : `https://sagard.opriel.com/api/v1`
- **Local** : modifier `API_URL` dans `lib/api.ts`

## Fonctionnalités

### Onglet Pointage
- Prise de poste (check-in) avec photo + GPS + sélection vacation (Jour/Nuit)
- Fin de poste (check-out) avec photo + GPS
- Historique des pointages du jour
- Détection automatique des retards

### Onglet Affectations
- Liste des déploiements actifs de l'agent
- Site, vacation, contrat, dates

### Onglet Paie
- Fiches de paie personnelles
- Détail : base, primes, retenues, brut, net
- Indication si paie bloquée

### Onglet Profil
- Informations personnelles
- Matricule, poste, statut
- Déconnexion sécurisée
