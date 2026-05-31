import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import SetupWizard from '../../src/screens/setup/SetupWizard'

export default function SetupRoute() {
  const { projectId } = useLocalSearchParams<{ projectId?: string }>()
  return <SetupWizard projectId={projectId}/>
}
