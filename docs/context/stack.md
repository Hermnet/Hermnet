# Stack técnico

## Backend
- **Java 21 + Spring Boot** (Maven en `backend/pom.xml`)
- **PostgreSQL** (connection en `application.properties`: `jdbc:postgresql://localhost:5432/hermnet_blind_db`, user/pass `alvaro_admin`)
- **Hibernate JPA** (`spring.jpa.hibernate.ddl-auto=update`)
- **jjwt** (firma HS256 — secret vía env `JWT_SECRET`, ≥32 bytes)
- **Firebase Admin SDK** para FCM (`hermnet-6d85d-firebase-adminsdk-...json` en `resources/`)
- **Spring Security** con filtros custom: `IpAnonymizationFilter`, `RateLimitFilter`, `JwtAuthenticationFilter` (ver `backend.md`)
- **CORS** configurado en `SecurityConfig.java` con orígenes desde env `CORS_ALLOWED_ORIGINS`
- Lombok para boilerplate

## Frontend
- **Expo SDK 54 + React Native 0.81 + TypeScript**
- **Development builds** (no Expo Go — módulos nativos requeridos)
- **Expo Router** (routing basado en carpetas `app/`)
- **expo-sqlite** (DB local, servicio en `services/DatabaseService.ts`)
- **expo-secure-store** (identidad RSA + JWT + PIN hash + preferencias)
- **react-native-quick-crypto** (RSA-2048 keygen, RSA-OAEP, AES-256-GCM, SHA-256, PBKDF2, firma SHA256withRSA)
- **zustand** para estado (`store/authStore.ts`)
- **@react-native-community/netinfo** (detección de conexión)
- **lucide-react-native** (iconos)
- **expo-linear-gradient** (gradientes)
- **react-native-qrcode-svg** (generación de QR)
- **react-native-svg** (patrones SVG para fondos de chat personalizables)
- **expo-document-picker** (selección de archivos .hnet para restaurar)
- **expo-file-system** (lectura/escritura de archivos de respaldo)
- **expo-local-authentication** (biometría — huella/FaceID)
- **expo-haptics** (feedback háptico)

> **Nota:** `tweetnacl` **no se utiliza** en el proyecto. Toda la criptografía se realiza con `react-native-quick-crypto` (RSA-2048, no Ed25519/X25519).

## Versiones exactas
Ver `frontend/package.json` y `backend/pom.xml`.
