import { Navigate, Route, Routes } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import SignupPage from './pages/SignupPage'
import VerifyPage from './pages/VerifyPage'
import EventsPage from './pages/EventsPage'
import CreateEventPage from './pages/CreateEventPage'
import EventOverviewPage from './pages/EventOverviewPage'
import AdminEventPage from './pages/AdminEventPage'
import PublicEventPage from './pages/PublicEventPage'
import VotingPage from './pages/Voting'
import TicketPage from './pages/TicketPage'
import ThankYouPage from './pages/ThankYouPage'
import { useAuth } from './context/AuthContext.jsx'

export default function App() {
  const { user, authReady } = useAuth()

  if (!authReady) {
    return null
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/home" element={<Navigate to="/" replace />} />
      
      {/* Auth Routes — only accessible when not authenticated */}
      <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/events" replace />} />
      <Route path="/verify" element={!user ? <VerifyPage /> : <Navigate to="/events" replace />} />

      {/* Protected Routes — requires authentication */}
      <Route path="/events" element={user ? <EventsPage user={user} /> : <Navigate to="/signup" replace />} />
      <Route path="/events/new" element={user ? <CreateEventPage /> : <Navigate to="/signup" replace />} />
      <Route path="/events/:eventId" element={user ? <EventOverviewPage user={user} /> : <Navigate to="/signup" replace />} />
      <Route path="/events/:eventId/admin" element={user ? <AdminEventPage user={user} /> : <Navigate to="/signup" replace />} />

      {/* Public Routes */}
      <Route path="/public/events/:eventId" element={<PublicEventPage />} />
      <Route path="/public/events/:eventId/voting/:awardId?/:nomineeSlug?" element={<VotingPage />} />
      
      {/* Other Routes */}
      <Route path="/thank-you" element={<ThankYouPage />} />
      <Route path="/tickets/:ticketId" element={<TicketPage />} />

      {/* Fallback — redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
