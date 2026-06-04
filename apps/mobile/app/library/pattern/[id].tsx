import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import PatternDetailScreen from '../../../src/screens/library/PatternDetailScreen'

export default function PatternDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <PatternDetailScreen id={id}/>
}
