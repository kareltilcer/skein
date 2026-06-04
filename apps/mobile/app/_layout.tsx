import 'react-native-get-random-values'
import '../src/i18n'
import React from 'react'
import { Stack as _Stack } from 'expo-router'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Stack = _Stack as any
import { StatusBar } from 'expo-status-bar'
import { useColorScheme } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { useFonts, Caprasimo_400Regular } from '@expo-google-fonts/caprasimo'
import { NotoSerifDisplay_700Bold } from '@expo-google-fonts/noto-serif-display'
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from '@expo-google-fonts/dm-sans'
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono'
import * as SplashScreen from 'expo-splash-screen'
import { ThemeProvider } from '../src/theme/ThemeContext'
import { useSettingsStore } from '../src/store/settingsStore'
import { detectSystemLanguage } from '../src/i18n'

SplashScreen.preventAutoHideAsync()

function RootLayout() {
  const themePref = useSettingsStore((s) => s.theme)
  const systemScheme = useColorScheme()
  const theme = themePref === 'auto' ? (systemScheme === 'dark' ? 'dark' : 'light') : themePref

  const languageInitialized = useSettingsStore((s) => s.languageInitialized)
  const setLanguage = useSettingsStore((s) => s.setLanguage)
  const [settingsHydrated, setSettingsHydrated] = React.useState(
    () => useSettingsStore.persist.hasHydrated(),
  )

  React.useEffect(() => {
    if (settingsHydrated) return
    const unsub = useSettingsStore.persist.onFinishHydration(() => setSettingsHydrated(true))
    if (useSettingsStore.persist.hasHydrated()) setSettingsHydrated(true)
    return unsub
  }, [settingsHydrated])

  React.useEffect(() => {
    if (!settingsHydrated) return
    if (!languageInitialized) setLanguage(detectSystemLanguage())
  }, [settingsHydrated, languageInitialized, setLanguage])

  const [fontsLoaded] = useFonts({
    Caprasimo_400Regular,
    NotoSerifDisplay_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    DMMono_400Regular,
  })

  React.useEffect(() => {
    if (fontsLoaded && settingsHydrated) SplashScreen.hideAsync()
  }, [fontsLoaded, settingsHydrated])

  if (!fontsLoaded || !settingsHydrated) return null

  return (
    <ThemeProvider theme={theme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index"/>
        <Stack.Screen name="(tabs)"/>
        <Stack.Screen name="setup/index" options={{ animation: 'slide_from_bottom' }}/>
        <Stack.Screen name="project/[id]" options={{ animation: 'slide_from_right' }}/>
        <Stack.Screen name="settings/language" options={{ animation: 'slide_from_right' }}/>
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'}/>
    </ThemeProvider>
  )
}

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <RootLayout/>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
