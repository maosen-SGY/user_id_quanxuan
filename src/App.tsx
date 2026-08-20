import { BrowserRouter, HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './components/Layout'
import AudienceListPage from './pages/AudienceList'
import AudienceCreatePage from './pages/AudienceCreate'
import AudienceDetailPage from './pages/AudienceDetail'
import OperatingActivityCreatePage from './pages/OperatingActivityCreate'

const Router = import.meta.env.PROD ? HashRouter : BrowserRouter

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/audiences" replace />} />
          <Route path="audiences" element={<AudienceListPage />} />
          <Route path="audiences/create" element={<AudienceCreatePage />} />
          <Route path="audiences/:id" element={<AudienceDetailPage />} />
          <Route
            path="operating-activity/create"
            element={<OperatingActivityCreatePage />}
          />
        </Route>
      </Routes>
    </Router>
  )
}
