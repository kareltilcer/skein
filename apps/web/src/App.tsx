import { Navigate, Route, Routes } from 'react-router-dom'
// import { useSettingsStore, useProjectStore } from '@skein/shared'
// import AppLayout from './layout/AppLayout'
// import HomeView from './screens/Home/HomeView'
// import WelcomeView from './screens/Welcome/WelcomeView'
// import LibraryView from './screens/Library/LibraryView'
// import SequenceDetailView from './screens/Library/SequenceDetailView'
// import PatternDetailView from './screens/Library/PatternDetailView'
// import RowDetailView from './screens/Library/RowDetailView'
// import NewRowView from './screens/Library/NewRowView'
// import NewSequenceView from './screens/Library/NewSequenceView'
// import NewPatternView from './screens/Library/NewPatternView'
// import CustomStitchView from './screens/Library/CustomStitchView'
// import KnitView from './screens/Knit/KnitView'
// import SetupWizard from './screens/Setup/SetupWizard'
// import SettingsView from './screens/Settings/SettingsView'
import AppInDevelopmentView from './screens/AppInDevelopment/AppInDevelopmentView'
import PrivacyPolicyView from './screens/PrivacyPolicy/PrivacyPolicyView'

// function HomeOrWelcome() {
//   const hasSeenWelcome = useSettingsStore((s) => s.hasSeenWelcome)
//   const projectCount = useProjectStore((s) => s.projects.length)
//   if (projectCount === 0 && !hasSeenWelcome) return <WelcomeView />
//   return <HomeView />
// }

export default function App() {
  // const { pathname } = useLocation()
  // const immersive = pathname.startsWith('/project/')
  return (
    <Routes>
      <Route path="/" element={<AppInDevelopmentView />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyView />} />
      {/*
      <Route path="/" element={<HomeOrWelcome />} />
      <Route path="/library" element={<LibraryView />} />
      <Route path="/library/sequence/:id" element={<SequenceDetailView />} />
      <Route path="/library/pattern/:id" element={<PatternDetailView />} />
      <Route path="/library/row/:id" element={<RowDetailView />} />
      <Route path="/library/new/row" element={<NewRowView />} />
      <Route path="/library/new/sequence" element={<NewSequenceView />} />
      <Route path="/library/new/pattern" element={<NewPatternView />} />
      <Route path="/library/new/custom-stitch" element={<CustomStitchView />} />
      <Route path="/library/row/:id/edit" element={<NewRowView />} />
      <Route path="/library/sequence/:id/edit" element={<NewSequenceView />} />
      <Route path="/library/pattern/:id/edit" element={<NewPatternView />} />
      <Route path="/project/new" element={<SetupWizard />} />
      <Route path="/project/:id" element={<KnitView />} />
      <Route path="/settings" element={<SettingsView />} />
      */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
