import {
  Phone, Shield, Heart, AlertTriangle, Siren, Users,
  ChevronRight, PhoneCall, ExternalLink
} from 'lucide-react'
import './SOSPage.css'

const emergencyContacts = [
  {
    id: 'personal',
    category: 'Your Emergency Contacts',
    icon: Users,
    color: '#a855f7',
    contacts: [
      { name: 'Maa', relation: 'Mother', phone: '+91 98765 43210' },
      { name: 'Papa', relation: 'Father', phone: '+91 98765 43211' },
      { name: 'Riya Kumar', relation: 'Sister', phone: '+91 87654 32109' },
    ],
  },
  {
    id: 'crisis',
    category: 'Suicide Prevention Helplines',
    icon: Heart,
    color: '#d26881',
    urgent: true,
    contacts: [
      { name: 'iCall', desc: 'Psychosocial Helpline', phone: '9152987821', available: 'Mon–Sat, 8AM–10PM' },
      { name: 'Vandrevala Foundation', desc: '24/7 Mental Health Support', phone: '1860 2662 345', available: '24/7' },
      { name: 'AASRA', desc: 'Crisis Intervention Centre', phone: '9820466726', available: '24/7' },
      { name: 'Snehi', desc: 'Emotional Support', phone: '044 24640050', available: '24/7' },
      { name: 'NIMHANS', desc: 'National Institute of Mental Health', phone: '080 46110007', available: 'Mon–Sat, 9AM–5PM' },
    ],
  },
  {
    id: 'emergency',
    category: 'Emergency Services',
    icon: Siren,
    color: '#e6a97d',
    contacts: [
      { name: 'Ambulance', desc: 'Medical Emergency', phone: '108', available: '24/7' },
      { name: 'Police', desc: 'Law Enforcement', phone: '100', available: '24/7' },
      { name: 'Emergency Helpline', desc: 'Unified Emergency Number', phone: '112', available: '24/7' },
      { name: 'Women Helpline', desc: 'National Commission for Women', phone: '181', available: '24/7' },
    ],
  },
]

export default function SOSPage() {
  const handleCall = (phone) => {
    window.location.href = `tel:${phone.replace(/\s/g, '')}`
  }

  return (
    <div className="page animate-in" id="sos-page">
      {/* Header */}
      <div className="page-header">
        <div className="sos-header-icon">
          <Shield size={24} />
        </div>
        <h1 className="page-title">Emergency SOS</h1>
        <p className="page-subtitle">Immediate help when you need it most</p>
      </div>

      {/* Quick SOS Banner */}
      <div className="sos-banner card animate-in animate-in-delay-1" id="sos-banner">
        <div className="sos-banner-glow" />
        <AlertTriangle size={20} className="sos-banner-icon" />
        <div className="sos-banner-text">
          <strong>If you're in immediate danger</strong>
          <p>Call 112 for unified emergency services</p>
        </div>
        <button
          className="sos-call-112"
          onClick={() => handleCall('112')}
          id="call-112"
        >
          <PhoneCall size={18} />
          112
        </button>
      </div>

      {/* Contact Sections */}
      {emergencyContacts.map((section, si) => (
        <section
          key={section.id}
          className={`section animate-in animate-in-delay-${Math.min(si + 2, 5)}`}
          id={`sos-${section.id}`}
        >
          <div className="sos-section-header">
            <div className="sos-section-icon" style={{ background: `${section.color}18`, color: section.color }}>
              <section.icon size={16} />
            </div>
            <div className="sos-section-title">{section.category}</div>
            {section.urgent && <span className="sos-urgent-tag">URGENT</span>}
          </div>

          <div className="sos-contact-list">
            {section.contacts.map((contact, ci) => (
              <button
                key={ci}
                className="sos-contact-item card"
                onClick={() => handleCall(contact.phone)}
                id={`sos-contact-${section.id}-${ci}`}
              >
                <div className="sos-contact-info">
                  <div className="sos-contact-name">{contact.name}</div>
                  <div className="sos-contact-desc">
                    {contact.relation || contact.desc}
                  </div>
                  {contact.available && (
                    <div className="sos-contact-avail">
                      <span className="sos-avail-dot" />
                      {contact.available}
                    </div>
                  )}
                </div>
                <div className="sos-contact-action">
                  <div className="sos-phone-number">{contact.phone}</div>
                  <div className="sos-call-btn" style={{ background: `${section.color}20`, color: section.color }}>
                    <Phone size={14} />
                    Call
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}

      {/* Disclaimer */}
      <div className="sos-disclaimer animate-in animate-in-delay-5">
        <p>You are not alone. Reaching out is the bravest thing you can do.</p>
        <p className="sos-disclaimer-sub">All calls are confidential · Data never recorded</p>
      </div>
    </div>
  )
}
