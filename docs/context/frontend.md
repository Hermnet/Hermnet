# Frontend — estructura

## Routing (Expo Router, `frontend/app/`)
- `_layout.tsx` — raíz: hydrate authStore, init SQLite, configura handler 401
- `index.tsx` — redirección inicial
- `(auth)/login.tsx` — entrada sin sesión (HomeScreen)
- `(app)/_layout.tsx` — guard de autenticación
- `(app)/mailbox/index.tsx` — chat list (ChatsScreen)
- `(app)/settings/index.tsx` — ajustes (SettingsScreen)

## Screens (`frontend/screens/`)
- `login/` — HomeScreen, PinScreen, LoadingScreen, ShimmerText
- `main/` — ChatsScreen, ChatRoomScreen, QRScannerScreen, ShowQRScreen
- `settings/` — SettingsScreen + subpantallas (Security, Privacy, Notifications, Accessibility, Help, Terms, Transfer)

## Services (`frontend/services/`)
| Archivo | Rol |
|---|---|
| `ApiClient.ts` | fetch genérico, interceptors JWT/401, autodetección URL backend |
| `AuthApiService.ts` | llamadas a `/api/auth/*` |
| `AuthFlowService.ts` | orquesta register → challenge → sign → login |
| `AuthSessionService.ts` | SecureStore: identity, JWT, PIN hash |
| `IdentityService.ts` | generación par de claves, firma nonce |
| `MessageApiService.ts` | llamadas a `/api/messages` |
| `MessageCryptoService.ts` | cifrado híbrido AES-256-GCM + RSA-OAEP-SHA256 |
| `MessageFlowService.ts` | orquesta envío/recepción completa |
| `ContactsService.ts` | vault local de contactos |
| `DatabaseService.ts` | init SQLite, migraciones, queries |

## Estado
- `store/authStore.ts` — zustand con identidad + JWT en memoria + hydrate desde SecureStore.

## Hooks (`frontend/hooks/`)
- `useNetworkStatus` — wrapper NetInfo (solo cae a offline si `isConnected === false`).

## Estilos
`frontend/styles/` — hojas por pantalla; tokens en `constants/` (`layout`, `colors`).
