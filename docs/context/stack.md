# Stack Técnico

## Backend

- Java 17.
- Spring Boot 3.5.
- Spring Security.
- Maven.
- PostgreSQL.
- Hibernate JPA.
- JJWT para JWT HS256.
- Firebase Admin SDK opcional para FCM.
- JaCoCo con mínimo 98% de cobertura de líneas en `mvn verify`.

## Frontend

- Expo SDK 54.
- React Native 0.81.
- TypeScript strict.
- Expo Router.
- Zustand.
- Expo SQLite.
- Expo SecureStore.
- `react-native-quick-crypto`.
- `node-forge` como fallback controlado en `CryptoService`.
- `lucide-react-native`.
- `react-native-qrcode-svg`.
- Jest + jest-expo.

## Notas

- No usar Expo Go. La app requiere development build por módulos nativos.
- No se usa `tweetnacl`.
- La identidad real usa RSA-2048, no Ed25519/X25519.
