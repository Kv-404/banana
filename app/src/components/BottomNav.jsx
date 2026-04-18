import { Home, Stethoscope, Sparkles, ShieldAlert, User } from 'lucide-react'
import './BottomNav.css'

const tabs = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'therapist', label: 'Therapist', Icon: Stethoscope },
  { id: 'ai', label: 'AI', Icon: Sparkles },
  { id: 'sos', label: 'SOS', Icon: ShieldAlert },
  { id: 'profile', label: 'Profile', Icon: User },
]

export default function BottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="bottom-nav glass" id="bottom-nav">
      {tabs.map(({ id, label, Icon }) => (
        <button
          key={id}
          id={`nav-${id}`}
          className={`nav-item ${activeTab === id ? 'active' : ''}`}
          onClick={() => setActiveTab(id)}
        >
          <div className="nav-icon-wrap">
            {id === 'ai' ? (
              <div className={`ai-orb ${activeTab === id ? 'active' : ''}`}>
                <Icon size={20} strokeWidth={2} />
              </div>
            ) : (
              <Icon size={20} strokeWidth={activeTab === id ? 2.2 : 1.6} />
            )}
            {activeTab === id && <div className="nav-dot" />}
          </div>
          <span className="nav-label">{label}</span>
        </button>
      ))}
    </nav>
  )
}
