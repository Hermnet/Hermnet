# Frontend — estructura

## Routing (Expo Router, `frontend/app/`)
- `_layout.tsx` — raíz: hydrate authStore, init SQLite, configura handler 401. Proveedores: `ThemeProvider > ChatPrefsProvider > AccessibilityProvider > ThemedApp`.
- `index.tsx` — redirección inicial
- `(auth)/login.tsx` — entrada sin sesión (HomeScreen)
- `(app)/_layout.tsx` — guard de autenticación
- `(app)/mailbox/index.tsx` — chat list (ChatsScreen)
- `(app)/settings/index.tsx` — ajustes (SettingsScreen)

## Screens (`frontend/screens/`)
- `login/` — HomeScreen, PinScreen, LoadingScreen (onboarding 5 slides), ShimmerText
- `main/` — ChatsScreen (con swipe-back gesture), ChatRoomScreen, QRScannerScreen, ShowQRScreen
- `settings/` — SettingsScreen + subpantallas (Security, Privacy, Notifications, Accessibility, Help, Terms, Transfer, Appearance → ChatCustomizationScreen)

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
| `PrefsService.ts` | persistencia de preferencias (accesibilidad, notificaciones, chat visual) en SecureStore |
| `RecoveryService.ts` | export/import archivo .hnet (PBKDF2 + AES-256-GCM) |

## Contexts (`frontend/contexts/`)
| Archivo | Rol |
|---|---|
| `ThemeContext.tsx` | colores del tema, dark mode |
| `ChatPrefsContext.tsx` | preferencias visuales de chat (colores burbujas, patrón fondo, esquinas). Resuelve valores vacíos → theme defaults. |
| `AccessibilityContext.tsx` | font scale, high contrast, reduce motion |

## Estado
- `store/authStore.ts` — zustand con identidad + JWT en memoria + hydrate desde SecureStore.

## Hooks (`frontend/hooks/`)
- `useNetworkStatus` — wrapper NetInfo (solo cae a offline si `isConnected === false`).
- `useHorizontalSlide` — transición horizontal spring-based (estilo iOS/WhatsApp) con dimming.
- `useSlideAnim` — animación "vault reveal" (scale + opacity) para sub-pantallas.

## Componentes (`frontend/components/`)
- `ChatBackground.tsx` — patrones SVG (dots, grid, hexagons, diagonal, none) para fondo de chat.
- `chat/MessageBubble.tsx` — burbuja de mensaje con soporte para colores custom, high contrast, reply-to, MatrixText reveal.

## Estilos
`frontend/styles/` — hojas por pantalla; tokens en `constants/` (`layout`, `colors`). Theme centralizado en `styles/theme.ts`.
