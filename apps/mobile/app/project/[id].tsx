import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import KnittingScreen from '../../src/screens/KnittingScreen'

export default function ProjectRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <KnittingScreen projectId={id}/>
}
