import React from 'react'
import { Redirect } from 'expo-router'
import { useSettingsStore } from '../src/store/settingsStore'
import EmptyScreen from '../src/screens/EmptyScreen'

export default function Index() {
  const hasSeenWelcome = useSettingsStore((s) => s.hasSeenWelcome)

  if (!hasSeenWelcome) {
    return <EmptyScreen/>
  }

  return <Redirect href="/(tabs)/"/>
}
