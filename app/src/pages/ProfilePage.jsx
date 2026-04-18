import {
  Wifi, WifiOff, Battery, BatteryCharging, Cpu, Thermometer,
  Signal, Settings, Bell, Lock, HelpCircle, LogOut,
  ChevronRight, User, Edit3, Shield
} from 'lucide-react'
import './ProfilePage.css'

export default function ProfilePage() {
  const deviceConnected = true
  const batteryLevel = 78
  const deviceTemp = 34
  const signalStrength = 'Strong'
  const firmwareVersion = 'v2.4.1'

  return (
    <div className="page animate-in" id="profile-page">
      {/* Profile Header */}
      <div className="profile-header animate-in animate-in-delay-1" id="profile-header">
        <div className="profile-avatar-section">
          <div className="profile-avatar">
            <span className="profile-avatar-text">J</span>
            <div className="profile-avatar-ring" />
          </div>
          <button className="profile-edit-btn" id="edit-profile">
            <Edit3 size={14} />
          </button>
        </div>
        <h2 className="profile-name">Jaspreet Bassi</h2>
        <p className="profile-email">jaspreet@gmail.com</p>
        <div className="profile-badges">
          <span className="badge badge-purple">
            <Shield size={10} />
            Pro Member
          </span>
          <span className="badge badge-green">
            <Wifi size={10} />
            Device Linked
          </span>
        </div>
      </div>

      {/* Device Status */}
      <section className="section animate-in animate-in-delay-2" id="device-status">
        <div className="card device-card">
          <div className="device-card-header">
            <div className="device-info-main">
              <div className="device-icon-wrap">
                <Cpu size={20} />
              </div>
              <div>
                <div className="card-title" style={{ marginBottom: 0 }}>Aura Node</div>
                <div className="device-status-text">
                  {deviceConnected ? (
                    <><Wifi size={12} className="status-icon connected" /> Connected</>
                  ) : (
                    <><WifiOff size={12} className="status-icon disconnected" /> Disconnected</>
                  )}
                </div>
              </div>
            </div>
            <div className={`device-status-badge ${deviceConnected ? 'online' : 'offline'}`}>
              {deviceConnected ? 'Online' : 'Offline'}
            </div>
          </div>

          {/* Device Metrics */}
          <div className="device-metrics">
            <div className="device-metric">
              <div className="dm-icon-wrap">
                {batteryLevel > 20 ? <Battery size={16} /> : <BatteryCharging size={16} />}
              </div>
              <div className="dm-info">
                <span className="dm-label">Battery</span>
                <span className="dm-value">{batteryLevel}%</span>
              </div>
              <div className="dm-bar-track">
                <div
                  className="dm-bar-fill"
                  style={{
                    width: `${batteryLevel}%`,
                    background: batteryLevel > 50
                      ? 'var(--mood-happy)'
                      : batteryLevel > 20
                        ? 'var(--mood-anxious)'
                        : 'var(--mood-stressed)'
                  }}
                />
              </div>
            </div>

            <div className="device-metric">
              <div className="dm-icon-wrap">
                <Thermometer size={16} />
              </div>
              <div className="dm-info">
                <span className="dm-label">Temperature</span>
                <span className="dm-value">{deviceTemp}°C</span>
              </div>
              <div className="dm-status normal">Normal</div>
            </div>

            <div className="device-metric">
              <div className="dm-icon-wrap">
                <Signal size={16} />
              </div>
              <div className="dm-info">
                <span className="dm-label">Signal</span>
                <span className="dm-value">{signalStrength}</span>
              </div>
              <div className="dm-signal-bars">
                <span className="signal-bar active" />
                <span className="signal-bar active" />
                <span className="signal-bar active" />
                <span className="signal-bar active" />
                <span className="signal-bar" />
              </div>
            </div>

            <div className="device-metric">
              <div className="dm-icon-wrap">
                <Cpu size={16} />
              </div>
              <div className="dm-info">
                <span className="dm-label">Firmware</span>
                <span className="dm-value">{firmwareVersion}</span>
              </div>
              <div className="dm-status uptodate">Up to date</div>
            </div>
          </div>
        </div>
      </section>

      {/* Settings Menu */}
      <section className="section animate-in animate-in-delay-3" id="settings-menu">
        <div className="card-label" style={{ padding: '0 4px', marginBottom: 10 }}>Settings</div>
        <div className="settings-list">
          {[
            { icon: Bell, label: 'Notifications', sub: 'Mood reminders, insights', id: 'settings-notif' },
            { icon: Lock, label: 'Privacy', sub: 'Data & permissions', id: 'settings-privacy' },
            { icon: Settings, label: 'Device Settings', sub: 'LED patterns, sensitivity', id: 'settings-device' },
            { icon: HelpCircle, label: 'Help & Support', sub: 'FAQs, contact us', id: 'settings-help' },
          ].map((item, i) => (
            <button key={i} className="settings-item" id={item.id}>
              <div className="settings-item-left">
                <div className="settings-icon-wrap">
                  <item.icon size={18} />
                </div>
                <div>
                  <div className="settings-label">{item.label}</div>
                  <div className="settings-sub">{item.sub}</div>
                </div>
              </div>
              <ChevronRight size={16} className="settings-chevron" />
            </button>
          ))}
        </div>
      </section>

      {/* Logout */}
      <section className="section animate-in animate-in-delay-4" id="logout-section">
        <button className="btn btn-secondary logout-btn" id="logout-btn">
          <LogOut size={16} />
          Sign Out
        </button>
        <p className="app-version">Adam v1.0.0 · Aura Node Platform</p>
      </section>
    </div>
  )
}
