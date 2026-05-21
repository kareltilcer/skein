// React 19 changed ReactPortal to require children, which breaks many third-party
// library JSX types (expo-router, react-native-safe-area-context, @gorhom/bottom-sheet,
// react-native-reanimated). Relaxing children back to optional restores compatibility.
import 'react'

declare module 'react' {
  interface ReactPortal {
    children?: React.ReactNode
  }
}
