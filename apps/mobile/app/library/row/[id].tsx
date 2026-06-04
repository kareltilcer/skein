import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import RowDetailScreen from '../../../src/screens/library/RowDetailScreen'

export default function RowDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <RowDetailScreen id={id}/>
}
