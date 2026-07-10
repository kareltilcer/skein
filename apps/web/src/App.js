import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Navigate, Route, Routes } from 'react-router-dom';
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
import AppInDevelopmentView from './screens/AppInDevelopment/AppInDevelopmentView';
import PrivacyPolicyView from './screens/PrivacyPolicy/PrivacyPolicyView';
// function HomeOrWelcome() {
//   const hasSeenWelcome = useSettingsStore((s) => s.hasSeenWelcome)
//   const projectCount = useProjectStore((s) => s.projects.length)
//   if (projectCount === 0 && !hasSeenWelcome) return <WelcomeView />
//   return <HomeView />
// }
export default function App() {
    // const { pathname } = useLocation()
    // const immersive = pathname.startsWith('/project/')
    return (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(AppInDevelopmentView, {}) }), _jsx(Route, { path: "/privacy-policy", element: _jsx(PrivacyPolicyView, {}) }), _jsx(Route, { path: "*", element: _jsx(Navigate, { to: "/", replace: true }) })] }));
}
