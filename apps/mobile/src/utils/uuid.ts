// Polyfill crypto.getRandomValues at the call site. `_layout.tsx` also imports
// this, but importing it here guarantees uuid never runs before the polyfill —
// some module-load orders (hot-reload of a screen, lazy-loaded route) could
// otherwise reach v4() before the entry import has executed.
import 'react-native-get-random-values'

// uuid 7.x ships no .d.ts. Use a local shim instead of pulling in @types/uuid.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { v4 } = require('uuid') as { v4: () => string }

export const uuid = (): string => v4()
