import React from 'react'
import { Tabs as _Tabs } from 'expo-router'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Tabs = _Tabs as any
import TabBar from '../../src/components/ui/TabBar'

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props: any) => <TabBar {...props}/>}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index"    options={{ title: 'Projects' }}/>
      <Tabs.Screen name="library"  options={{ title: 'Library'  }}/>
      <Tabs.Screen name="settings" options={{ title: 'Settings' }}/>
    </Tabs>
  )
}
