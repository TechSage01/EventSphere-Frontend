import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import SignupPage from './pages/SignupPage'
import VerifyPage from './pages/VerifyPage'
import EventsPage from './pages/EventsPage'
import CreateEventPage from './pages/CreateEventPage'
import EventOverviewPage from './pages/EventOverviewPage'
import PublicEventPage from './pages/PublicEventPage'
import TicketPage from './pages/TicketPage'

export default function App() {
  const user = getUser()

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/events" element={user ? <EventsPage user={user} /> : <Navigate to="/signup" replace />} />
      <Route path="/events/new" element={user ? <CreateEventPage /> : <Navigate to="/signup" replace />} />
      <Route path="/events/:eventId" element={user ? <EventOverviewPage user={user} /> : <Navigate to="/signup" replace />} />
      <Route path="/public/events/:eventId" element={<PublicEventPage />} />
      <Route path="/tickets/:ticketId" element={<TicketPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function getUser() {
  try {
    const raw = localStorage.getItem('es_user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}
