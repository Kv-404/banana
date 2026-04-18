import { useMemo } from 'react'
import { AlertTriangle, Sun, TrendingUp, TrendingDown } from 'lucide-react'
import './HomePage.css'

const moods = [
  { id: 'happy', label: 'Happy', emoji: '😊', color: '#e5c652' },
  { id: 'calm', label: 'Calm', emoji: '😌', color: '#ffaabb' },
  { id: 'neutral', label: 'Neutral', emoji: '😐', color: '#efe7da' },
  { id: 'anxious', label: 'Anxious', emoji: '😰', color: '#e6a97d' },
  { id: 'stressed', label: 'Stressed', emoji: '😤', color: '#b9bd9d' },
  { id: 'sad', label: 'Sad', emoji: '😢', color: '#d5d4d4' },
  { id: 'anger', label: 'Anger', emoji: '😡', color: '#d26881' },
]

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

// Build heatmap color map from the hex values
const moodColorMap = {}
moods.forEach(m => {
  moodColorMap[m.id] = {
    1: hexToRgba(m.color, 0.2),
    2: hexToRgba(m.color, 0.4),
    3: hexToRgba(m.color, 0.65),
    4: hexToRgba(m.color, 0.9),
  }
})

// Helper: get greeting based on current hour
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

// Helper: format date
function formatDate(date) {
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Generate 30-day heatmap starting from today going FORWARD
function generate30DayHeatmap(todayMood) {
  const today = new Date()
  const days = []

  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)

    if (i === 0) {
      // Today — the first and only day with data
      days.push({ date, mood: todayMood, intensity: 3 })
    } else {
      // Future days — no data yet
      days.push({ date, mood: null, intensity: 0 })
    }
  }
  return days
}

// Generate 7PM to 7AM hourly mood bars for today (varying moods, averaging to stressed)
function generateHourlyMoodBars() {
  // Hours from 7PM (19) through midnight to 7AM (7) = 13 hours
  // We want varying moods that average out to "stressed"
  const hourlyData = [
    { hour: '7 PM', mood: 'anxious', score: 55 },
    { hour: '8 PM', mood: 'stressed', score: 42 },
    { hour: '9 PM', mood: 'anger', score: 35 },
    { hour: '10 PM', mood: 'stressed', score: 40 },
    { hour: '11 PM', mood: 'sad', score: 48 },
    { hour: '12 AM', mood: 'anxious', score: 38 },
    { hour: '1 AM', mood: 'stressed', score: 30 },
    { hour: '2 AM', mood: 'calm', score: 55 },
    { hour: '3 AM', mood: 'neutral', score: 50 },
    { hour: '4 AM', mood: 'stressed', score: 35 },
    { hour: '5 AM', mood: 'sad', score: 42 },
    { hour: '6 AM', mood: 'anxious', score: 45 },
    { hour: '7 AM', mood: 'stressed', score: 38 },
  ]
  return hourlyData
}

export default function HomePage() {
  // AI-predicted mood — currently hardcoded to "stressed"
  const predictedDailyMood = 'stressed'
  const dailyMoodObj = moods.find(m => m.id === predictedDailyMood)

  // Hourly mood data (7PM – 7AM) for today
  const hourlyData = useMemo(() => generateHourlyMoodBars(), [])

  // Average score from hourly data
  const avgScore = Math.round(hourlyData.reduce((sum, d) => sum + d.score, 0) / hourlyData.length)

  // 30-day heatmap (only today has data)
  const heatmapDays = useMemo(() => generate30DayHeatmap(predictedDailyMood), [])

  // Organize heatmap into weeks (columns) going forward from today
  const heatmapGrid = useMemo(() => {
    const weeks = []
    let currentWeek = []
    heatmapDays.forEach((day, i) => {
      const dow = day.date.getDay() // 0=Sun
      const adjustedDow = dow === 0 ? 6 : dow - 1 // Mon=0 ... Sun=6
      if (i === 0 && adjustedDow !== 0) {
        // Pad the first week with empties before today
        for (let p = 0; p < adjustedDow; p++) {
          currentWeek.push(null)
        }
      }
      currentWeek.push(day)
      if (adjustedDow === 6 || i === heatmapDays.length - 1) {
        while (currentWeek.length < 7) currentWeek.push(null)
        weeks.push(currentWeek)
        currentWeek = []
      }
    })
    return weeks
  }, [heatmapDays])

  // Personalized theme message based on mood
  const getThemeMessage = () => {
    if (predictedDailyMood === 'stressed') {
      return {
        message: "You seem stressed today. Take a moment to breathe deeply. A 5-minute break can work wonders for your mental clarity.",
        highlight: 'stressed',
        highlightColor: '#b9bd9d',
        iconBg: 'rgba(185, 189, 157, 0.15)',
        iconColor: '#b9bd9d',
        Icon: AlertTriangle,
        glowColor: 'rgba(185, 189, 157, 0.15)',
        gradientFrom: 'rgba(185, 189, 157, 0.08)',
        borderColor: 'rgba(185, 189, 157, 0.15)',
      }
    }
    return {
      message: "Your week has been mostly positive. Keep up the good energy! Try a short meditation to maintain balance.",
      highlight: 'positive',
      highlightColor: '#e5c652',
      iconBg: 'rgba(229, 198, 82, 0.15)',
      iconColor: '#e5c652',
      Icon: Sun,
      glowColor: 'rgba(229, 198, 82, 0.15)',
      gradientFrom: 'rgba(229, 198, 82, 0.08)',
      borderColor: 'rgba(229, 198, 82, 0.15)',
    }
  }

  const theme = getThemeMessage()

  return (
    <div className="page animate-in" id="home-page">
      {/* Header */}
      <div className="page-header home-header">
        <div className="home-greeting">
          <p className="greeting-time">{getGreeting()}</p>
          <h1 className="page-title">Your Aura Today</h1>
        </div>
        <div className="header-aura-indicator">
          <div className="aura-ring" style={{ '--ring-color': dailyMoodObj?.color || 'var(--accent-primary)' }}>
            <span className="aura-emoji">{dailyMoodObj?.emoji || '✨'}</span>
          </div>
        </div>
      </div>

      {/* Daily Mood + Weekly Mood side by side */}
      <section className="section animate-in animate-in-delay-1" id="mood-overview">
        <div className="mood-overview-row">
          {/* Left: Daily Mood */}
          <div className="card mood-daily-card" id="daily-mood">
            <div className="card-label">Today's Mood</div>
            <div className="daily-mood-display">
              <div className="daily-emoji-ring" style={{ '--mood-color': dailyMoodObj?.color }}>
                <span className="daily-emoji">{dailyMoodObj?.emoji}</span>
              </div>
              <div className="daily-mood-label" style={{ color: dailyMoodObj?.color }}>
                {dailyMoodObj?.label}
              </div>
              <div className="daily-mood-source">
                <span className="source-dot" />
                AI Predicted
              </div>
            </div>
            <div className="daily-mood-date">{formatDate(new Date())}</div>
          </div>

          {/* Right: Weekly Mood — Hourly bars 7PM to 7AM */}
          <div className="card mood-weekly-card" id="weekly-mood">
            <div className="weekly-card-top">
              <div>
                <div className="card-label">Tonight</div>
                <div className="weekly-time-range">7 PM — 7 AM</div>
              </div>
              <div className="weekly-avg-badge">
                <span className="weekly-avg-num">{avgScore}</span>
                <span className="weekly-avg-label">avg</span>
              </div>
            </div>
            <div className="weekly-mini-bars">
              {hourlyData.map((d, i) => {
                const mObj = moods.find(m => m.id === d.mood)
                return (
                  <div key={i} className="mini-bar-col">
                    <div className="mini-bar-track">
                      <div
                        className="mini-bar-fill"
                        style={{
                          height: `${d.score}%`,
                          background: mObj?.color || '#b9bd9d',
                        }}
                      />
                    </div>
                    <span className="mini-bar-hour">{d.hour.split(' ')[0]}</span>
                  </div>
                )
              })}
            </div>
            <div className="weekly-mood-avg-label">
              Avg mood: <span style={{ color: dailyMoodObj?.color, fontWeight: 600 }}>{dailyMoodObj?.label}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Theme */}
      <section className="section animate-in animate-in-delay-2" id="personalized-theme">
        <div
          className="card theme-card"
          style={{
            background: `linear-gradient(135deg, ${theme.gradientFrom}, rgba(168, 85, 247, 0.06))`,
            borderColor: theme.borderColor,
          }}
        >
          <div className="theme-glow" style={{ background: `radial-gradient(circle, ${theme.glowColor} 0%, transparent 70%)` }} />
          <div className="theme-content">
            <div className="theme-icon-wrap" style={{ background: theme.iconBg, color: theme.iconColor }}>
              <theme.Icon size={22} />
            </div>
            <div className="theme-info">
              <div className="card-label">Personalized for You</div>
              <div className="theme-message">
                You seem <span className="theme-highlight" style={{ color: theme.highlightColor }}>{theme.highlight}</span> today. {theme.message.split('. ').slice(1).join('. ')}
              </div>
            </div>
          </div>
          <div className="theme-stats">
            <div className="theme-stat">
              <TrendingUp size={14} style={{ color: theme.iconColor }} />
              <span>Stress detected via conversation</span>
            </div>
            <div className="theme-stat">
              <TrendingDown size={14} style={{ color: '#ffaabb' }} />
              <span>Calm periods: late night</span>
            </div>
          </div>
        </div>
      </section>

      {/* 30-Day Mood Heatmap + Mood Colors side by side */}
      <section className="section animate-in animate-in-delay-3" id="mood-heatmap">
        <div className="heatmap-row">
          {/* Heatmap Card */}
          <div className="card heatmap-card">
            <div className="heatmap-header">
              <div>
                <div className="card-label">Next 30 Days</div>
                <div className="card-title">Activity Heatmap</div>
              </div>
              <div className="heatmap-today-badge">
                <span className="heatmap-today-dot" style={{ background: dailyMoodObj?.color }} />
                Day 1
              </div>
            </div>
            <div className="heatmap-container">
              <div className="heatmap-days">
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <span key={i} className="heatmap-day-label">{d}</span>
                ))}
              </div>
              <div className="heatmap-grid">
                {heatmapGrid.map((week, wi) => (
                  <div key={wi} className="heatmap-col">
                    {week.map((cell, di) => {
                      if (!cell) return <div key={di} className="heatmap-cell empty" />
                      const isToday = cell.date.toDateString() === new Date().toDateString()
                      const hasData = cell.intensity > 0
                      return (
                        <div
                          key={di}
                          className={`heatmap-cell ${isToday ? 'today' : ''} ${!hasData ? 'no-data' : ''}`}
                          style={{
                            background: hasData
                              ? (moodColorMap[cell.mood]?.[cell.intensity] || 'rgba(168,85,247,0.3)')
                              : 'rgba(255,255,255,0.03)'
                          }}
                          title={isToday ? `Today — ${cell.mood}` : cell.date.toLocaleDateString()}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="heatmap-legend">
              <span className="heatmap-legend-label">No data</span>
              <div className="heatmap-legend-cells">
                <div className="heatmap-cell" style={{ background: 'rgba(255,255,255,0.03)' }} />
                <div className="heatmap-cell" style={{ background: hexToRgba('#b9bd9d', 0.2) }} />
                <div className="heatmap-cell" style={{ background: hexToRgba('#b9bd9d', 0.4) }} />
                <div className="heatmap-cell" style={{ background: hexToRgba('#b9bd9d', 0.65) }} />
                <div className="heatmap-cell" style={{ background: hexToRgba('#b9bd9d', 0.9) }} />
              </div>
              <span className="heatmap-legend-label">Intense</span>
            </div>
          </div>

          {/* Mood Colors Card */}
          <div className="card mood-colors-card" id="mood-colors">
            <div className="card-label">Mood Colors</div>
            <div className="mood-colors-list">
              {moods.map(m => (
                <div key={m.id} className="mood-color-row">
                  <div className="mood-color-swatch" style={{ background: m.color }} />
                  <span className="mood-color-name">{m.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
