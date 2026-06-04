import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import SequenceDetailScreen from '../../../src/screens/library/SequenceDetailScreen'

export default function SequenceDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <SequenceDetailScreen id={id}/>
}
