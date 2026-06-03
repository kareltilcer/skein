// uuid 7.x ships no .d.ts. Use a local shim instead of pulling in @types/uuid.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4 } = require('uuid') as { v4: () => string }

// Relies on `react-native-get-random-values` being imported at app entry
// (see apps/mobile/app/_layout.tsx) so crypto.getRandomValues is polyfilled.
export const uuid = (): string => v4()
