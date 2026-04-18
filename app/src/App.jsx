import { useState } from 'react'
import './index.css'
import './App.css'
import BottomNav from './components/BottomNav'
import HomePage from './pages/HomePage'
import TherapistPage from './pages/TherapistPage'
import AIPage from './pages/AIPage'
import SOSPage from './pages/SOSPage'
import ProfilePage from './pages/ProfilePage'

function App() {
  const [activeTab, setActiveTab] = useState('home')

  const renderPage = () => {
    switch (activeTab) {
      case 'home': return <HomePage />
      case 'therapist': return <TherapistPage />
      case 'ai': return <AIPage />
      case 'sos': return <SOSPage />
      case 'profile': return <ProfilePage />
      default: return <HomePage />
    }
  }

  return (
    <div className="app-container">
      <div className="app-bg-glow" />
      {renderPage()}
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}

export default App
