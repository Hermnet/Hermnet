# Stack técnico

## Backend
- **Java 21 + Spring Boot** (Maven en `backend/pom.xml`)
- **PostgreSQL** (connection en `application.properties`: `jdbc:postgresql://localhost:5432/hermnet_blind_db`, user/pass `alvaro_admin`)
- **Hibernate JPA** (`spring.jpa.hibernate.ddl-auto=update`)
- **jjwt** (firma HS256 — secret en `jwt.secret`, ≥32 bytes)
- **Firebase Admin SDK** para FCM (`hermnet-6d85d-firebase-adminsdk-...json` en `resources/`)
- **Spring Security** con filtros custom: `IpAnonymizationFilter`, `RateLimitFilter`, `JwtAuthenticationFilter` (ver `backend.md`)
- Lombok para boilerplate

## Frontend
- **Expo SDK 54 + React Native 0.81 + TypeScript**
- **Expo Router** (routing basado en carpetas `app/`)
- **expo-sqlite** (DB local cifrada, servicio en `services/DatabaseService.ts`)
- **expo-secure-store** (identidad + JWT + PIN hash)
- **react-native-quick-crypto** (hash, crypto — fallback a nativo)
- **tweetnacl** (Ed25519 sign / X25519)
- **zustand** para estado (`store/authStore.ts`)
- **@react-native-community/netinfo** (conexión)
- **lucide-react-native**, **expo-linear-gradient**, **react-native-qrcode-svg**

## Versiones exactas
Ver `frontend/package.json` y `backend/pom.xml`.
