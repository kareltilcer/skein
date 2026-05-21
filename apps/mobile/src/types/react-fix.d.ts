// React 19 changed ReactPortal to require children, breaking many third-party
// library types (expo-router, react-native-safe-area-context, @gorhom/bottom-sheet).
// This relaxes the requirement back to optional.
import 'react'

declare module 'react' {
  interface ReactPortal {
    children?: ReactNode
  }
}
