import { Star, Clock, Phone, MapPin, ChevronRight, Search } from 'lucide-react'
import { useState } from 'react'
import './TherapistPage.css'

const therapists = [
  {
    id: 1,
    name: 'Dr. Priya Mehta',
    specialty: 'Clinical Psychologist',
    experience: '12 yrs',
    rating: 4.9,
    reviews: 284,
    charge: 1200,
    available: true,
    languages: ['English', 'Hindi'],
    avatar: '👩🏻‍⚕️',
    nextSlot: 'Today, 5:30 PM',
    modes: ['phone'],
  },
  {
    id: 2,
    name: 'Dr. Arjun Sharma',
    specialty: 'Psychiatrist',
    experience: '18 yrs',
    rating: 4.8,
    reviews: 412,
    charge: 1800,
    available: true,
    languages: ['English', 'Hindi', 'Punjabi'],
    avatar: '👨🏽‍⚕️',
    nextSlot: 'Today, 7:00 PM',
    modes: ['video', 'phone'],
  },
  {
    id: 3,
    name: 'Dr. Kavitha Rajan',
    specialty: 'Cognitive Behavioral Therapist',
    experience: '9 yrs',
    rating: 4.7,
    reviews: 198,
    charge: 1000,
    available: true,
    languages: ['English', 'Tamil', 'Hindi'],
    avatar: '👩🏽‍⚕️',
    nextSlot: 'Tomorrow, 10:00 AM',
    modes: ['phone'],
  },
  {
    id: 4,
    name: 'Dr. Rohan Desai',
    specialty: 'Neuropsychologist',
    experience: '15 yrs',
    rating: 4.9,
    reviews: 356,
    charge: 2000,
    available: false,
    languages: ['English', 'Hindi', 'Marathi'],
    avatar: '👨🏻‍⚕️',
    nextSlot: 'Mon, 11:00 AM',
    modes: ['video', 'phone'],
  },
  {
    id: 5,
    name: 'Dr. Sneha Iyer',
    specialty: 'Trauma & PTSD Specialist',
    experience: '11 yrs',
    rating: 4.8,
    reviews: 221,
    charge: 1500,
    available: true,
    languages: ['English', 'Hindi', 'Kannada'],
    avatar: '👩🏽‍⚕️',
    nextSlot: 'Today, 8:00 PM',
    modes: ['video', 'phone'],
  },
  {
    id: 6,
    name: 'Dr. Vikram Malhotra',
    specialty: 'Adolescent Psychologist',
    experience: '8 yrs',
    rating: 4.6,
    reviews: 167,
    charge: 900,
    available: true,
    languages: ['English', 'Hindi'],
    avatar: '👨🏽‍⚕️',
    nextSlot: 'Tomorrow, 2:00 PM',
    modes: ['video'],
  },
  {
    id: 7,
    name: 'Dr. Ananya Bose',
    specialty: 'Relationship Counselor',
    experience: '14 yrs',
    rating: 4.9,
    reviews: 389,
    charge: 1600,
    available: true,
    languages: ['English', 'Hindi', 'Bengali'],
    avatar: '👩🏻‍⚕️',
    nextSlot: 'Today, 6:00 PM',
    modes: ['video', 'phone'],
  },
]

export default function TherapistPage() {
  const [search, setSearch] = useState('')

  const filtered = therapists.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.specialty.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page animate-in" id="therapist-page">
      <div className="page-header">
        <h1 className="page-title">Find a Therapist</h1>
        <p className="page-subtitle">Talk to verified mental health professionals</p>
      </div>

      {/* Search */}
      <div className="search-bar animate-in animate-in-delay-1" id="therapist-search">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search by name or specialty..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Quick Filters */}
      <div className="filter-pills animate-in animate-in-delay-2">
        <button className="filter-pill active">All</button>
        <button className="filter-pill">Available Now</button>
        <button className="filter-pill">Top Rated</button>
        <button className="filter-pill">Under ₹1200</button>
      </div>

      {/* Therapist List */}
      <div className="therapist-list">
        {filtered.map((doc, i) => (
          <div
            key={doc.id}
            className={`therapist-card card animate-in animate-in-delay-${Math.min(i + 2, 5)}`}
            id={`therapist-${doc.id}`}
          >
            <div className="doc-main">
              <div className="doc-avatar-wrap">
                <span className="doc-avatar">{doc.avatar}</span>
                {doc.available && <span className="doc-online" />}
              </div>
              <div className="doc-info">
                <div className="doc-name">{doc.name}</div>
                <div className="doc-specialty">{doc.specialty}</div>
                <div className="doc-meta">
                  <span className="doc-rating">
                    <Star size={12} fill="var(--accent-amber)" color="var(--accent-amber)" />
                    {doc.rating}
                  </span>
                  <span className="doc-reviews">({doc.reviews})</span>
                  <span className="doc-exp">{doc.experience}</span>
                </div>
              </div>
            </div>

            <div className="doc-details">
              <div className="doc-detail-row">
                <div className="doc-charge">
                  <span className="charge-amount">₹{doc.charge}</span>
                  <span className="charge-label">/session (60 min)</span>
                </div>
                <div className="doc-modes">
                  {doc.modes.includes('phone') && (
                    <span className="mode-badge"><Phone size={12} /></span>
                  )}
                </div>
              </div>

              <div className="doc-slot">
                <Clock size={12} />
                <span>Next: {doc.nextSlot}</span>
              </div>

              <div className="doc-languages">
                {doc.languages.map(lang => (
                  <span key={lang} className="lang-tag">{lang}</span>
                ))}
              </div>
            </div>

            <button className="btn btn-primary btn-sm doc-book-btn" id={`book-${doc.id}`}>
              Book Session
              <ChevronRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
