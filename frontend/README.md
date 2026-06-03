# ChessMate (Rebuild)

Production-ready React Native chess multiplayer. Drop-in replacement for
the legacy `mobile/` app, with every spec-listed bug fix applied.

## Stack
- React Native 0.75 + TypeScript (strict)
- React Navigation v6 (native-stack + bottom-tabs)
- Zustand for global state, React Query for server data
- Socket.IO singleton with React context
- chess.js for ALL move validation (never custom)
- react-native-reanimated 3 + gesture-handler for animations
- react-native-svg (Merida-style inline SVG pieces — no image files)
- react-native-sound + react-native-haptic-feedback (toggleable in Settings)
- MMKV for local persistence
- Jest + RNTL + Detox for testing

## Project layout
```
src/
  api/          # axios client, socket singleton, SocketContext
  components/   # Board/, Pieces/, Timer/, CapturedRow/, …
  constants/    # theme, time controls, socket event names, sound keys
  hooks/        # useChessGame, useTimer, useSocket, useHaptics
  navigation/   # RootNavigator, TabNavigator, route types
  screens/      # Splash, Auth, Home, Matchmaking, Game, PostGame, Replay, Profile, Settings
  store/        # gameStore, userStore, settingsStore (Zustand + MMKV)
  types/        # shared TS interfaces
  utils/        # chessHelpers, storage, soundManager, hapticManager
  __tests__/    # mirrors src/
```

## Bug fixes mapped to code
| # | Description | Where |
|---|-------------|-------|
| BUG-1 | Full reset between matches | `gameStore.startMatch()`, `useChessGame` reinit on `matchId` change |
| BUG-2 | No listener leaks | Singleton socket in `api/socket.ts`; scoped `socket.on/off` in `useEffect` |
| BUG-3 | Board derived from chess.js | `useChessGame` exposes `pieces` from `chess.board()` only |
| BUG-4 | Promotion bottom sheet | `components/PromotionModal.tsx` |
| BUG-5 | Server-driven timer | `useTimer` re-bases on `lastServerSyncAt`/`syncTimes` |
| BUG-6 | Rematch flow | `PostGameScreen` request/accept/decline + `resetGame()` |
| BUG-7 | Check/checkmate/draw banner + haptic | `CheckBanner` + GameScreen effects |

## Bootstrap

```bash
cd mobile-rebuild
npm install
# iOS
cd ios && pod install && cd ..
npm run ios
# Android
npm run android
```

Configure the backend URL in `src/api/config.ts` (defaults to `http://localhost:3001`).

## Audio assets
Drop the following files under `src/assets/sounds/` AND ensure native bundle:
- iOS: add to Xcode "Copy Bundle Resources"
- Android: place mirrors in `android/app/src/main/res/raw/` (lowercase, no extension)

Files: `move_self.mp3 move_opponent.mp3 capture.mp3 check.mp3 castle.mp3 promote.mp3 game_start.mp3 game_end_win.mp3 game_end_lose.mp3 draw.mp3 tick.mp3 notify.mp3`

## Tests
```bash
npm test                 # unit + component (Jest + RNTL)
npm run e2e:build:ios    # build for Detox
npm run e2e:test:ios     # full game E2E
```

## Performance notes
- Pieces are memoized SVGs — identical pieces never re-render.
- Move animation runs on UI thread via Reanimated worklets.
- Move history uses `FlatList` virtualization.
- All socket listeners are scoped to `useEffect` with explicit cleanup.
