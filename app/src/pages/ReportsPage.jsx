import { useState } from 'react'
import {
  Download, Share2, Calendar, TrendingUp, TrendingDown, Activity,
  Brain, Zap, Moon, Heart, ChevronRight, FileText, BarChart3
} from 'lucide-react'
import './ReportsPage.css'

const dailyMetrics = [
  { label: 'Stress Level', value: '32%', trend: 'down', change: '-5%', icon: Zap, color: 'var(--mood-stressed)' },
  { label: 'Emotional Load', value: '58%', trend: 'up', change: '+3%', icon: Heart, color: 'var(--accent-pink)' },
  { label: 'Cognitive Clarity', value: '74%', trend: 'up', change: '+8%', icon: Brain, color: 'var(--accent-teal)' },
  { label: 'Sleep Quality', value: '81%', trend: 'up', change: '+2%', icon: Moon, color: 'var(--accent-blue)' },
]

const weeklyInsights = [
  'Your stress patterns peak on Wednesdays — likely mid-week workload pressure.',
  'Social interactions on weekends significantly improve your emotional baseline.',
  'Evening screen time correlates with 23% lower sleep quality scores.',
  'Morning routines on Mon/Tue show 40% better cognitive clarity than other days.',
]

const hourlyData = [
  { hour: '6AM', stress: 15, energy: 45 },
  { hour: '8AM', stress: 20, energy: 68 },
  { hour: '10AM', stress: 28, energy: 82 },
  { hour: '12PM', stress: 35, energy: 70 },
  { hour: '2PM', stress: 52, energy: 55 },
  { hour: '4PM', stress: 45, energy: 48 },
  { hour: '6PM', stress: 38, energy: 60 },
  { hour: '8PM', stress: 25, energy: 42 },
  { hour: '10PM', stress: 18, energy: 30 },
]

export default function ReportsPage() {
  const [tab, setTab] = useState('daily')

  return (
    <div className="page animate-in" id="reports-page">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Your emotional intelligence insights</p>
      </div>

      {/* Tab Toggle */}
      <div className="report-tabs animate-in animate-in-delay-1" id="report-tabs">
        <button
          className={`report-tab ${tab === 'daily' ? 'active' : ''}`}
          onClick={() => setTab('daily')}
          id="tab-daily"
        >
          <Calendar size={14} />
          Daily Report
        </button>
        <button
          className={`report-tab ${tab === 'weekly' ? 'active' : ''}`}
          onClick={() => setTab('weekly')}
          id="tab-weekly"
        >
          <BarChart3 size={14} />
          Weekly Report
        </button>
      </div>

      {tab === 'daily' && (
        <div className="report-content" key="daily">
          {/* Date Header */}
          <div className="report-date-header animate-in animate-in-delay-2">
            <FileText size={16} className="report-date-icon" />
            <div>
              <div className="report-date">Friday, April 18, 2026</div>
              <div className="report-date-sub">Daily Emotional Summary</div>
            </div>
          </div>

          {/* Human State Index */}
          <div className="card hsi-card animate-in animate-in-delay-2" id="hsi-card">
            <div className="hsi-header">
              <div>
                <div className="card-label">Human State Index</div>
                <div className="hsi-value">
                  <span className="hsi-number">72</span>
                  <span className="hsi-max">/100</span>
                </div>
              </div>
              <div className="hsi-ring">
                <svg viewBox="0 0 60 60" className="hsi-svg">
                  <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="5" />
                  <circle
                    cx="30" cy="30" r="26" fill="none"
                    stroke="url(#hsiGrad)" strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${72 * 1.63} ${163 - 72 * 1.63}`}
                    transform="rotate(-90 30 30)"
                    className="hsi-progress"
                  />
                  <defs>
                    <linearGradient id="hsiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--accent-primary)" />
                      <stop offset="100%" stopColor="var(--accent-pink)" />
                    </linearGradient>
                  </defs>
                </svg>
                <Activity size={18} className="hsi-icon" />
              </div>
            </div>
            <div className="hsi-status">
              <span className="badge badge-green">● Balanced</span>
              <span className="hsi-desc">Your overall state is healthy and stable.</span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="metrics-grid animate-in animate-in-delay-3">
            {dailyMetrics.map((m, i) => (
              <div key={i} className="metric-card card" id={`metric-${i}`}>
                <div className="metric-icon" style={{ background: `color-mix(in srgb, ${m.color} 12%, transparent)`, color: m.color }}>
                  <m.icon size={16} />
                </div>
                <div className="metric-value">{m.value}</div>
                <div className="metric-label">{m.label}</div>
                <div className={`metric-trend ${m.trend}`}>
                  {m.trend === 'up' ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {m.change}
                </div>
              </div>
            ))}
          </div>

          {/* Hourly Chart */}
          <div className="card animate-in animate-in-delay-4" id="hourly-chart">
            <div className="card-label">Hourly Breakdown</div>
            <div className="card-title">Stress vs Energy</div>
            <div className="hourly-chart">
              {hourlyData.map((d, i) => (
                <div key={i} className="hourly-col">
                  <div className="hourly-bars">
                    <div className="hourly-bar stress" style={{ height: `${d.stress}%` }} title={`Stress: ${d.stress}%`} />
                    <div className="hourly-bar energy" style={{ height: `${d.energy}%` }} title={`Energy: ${d.energy}%`} />
                  </div>
                  <span className="hourly-label">{d.hour}</span>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item"><span className="legend-dot stress" /> Stress</div>
              <div className="legend-item"><span className="legend-dot energy" /> Energy</div>
            </div>
          </div>

          {/* Actions */}
          <div className="report-actions animate-in animate-in-delay-5">
            <button className="btn btn-primary" id="download-daily">
              <Download size={16} />
              Download Report
            </button>
            <button className="btn btn-secondary" id="share-daily">
              <Share2 size={16} />
              Share
            </button>
          </div>
        </div>
      )}

      {tab === 'weekly' && (
        <div className="report-content" key="weekly">
          {/* Weekly Summary */}
          <div className="report-date-header animate-in animate-in-delay-2">
            <BarChart3 size={16} className="report-date-icon" />
            <div>
              <div className="report-date">Week of April 12 – 18, 2026</div>
              <div className="report-date-sub">Weekly Emotional Review</div>
            </div>
          </div>

          {/* Score Comparison */}
          <div className="card week-compare-card animate-in animate-in-delay-2" id="weekly-compare">
            <div className="card-label">Weekly Comparison</div>
            <div className="week-compare">
              <div className="compare-col">
                <div className="compare-label">This Week</div>
                <div className="compare-value good">72</div>
                <div className="compare-sub">avg HSI</div>
              </div>
              <div className="compare-divider">
                <ChevronRight size={16} />
              </div>
              <div className="compare-col">
                <div className="compare-label">Last Week</div>
                <div className="compare-value">65</div>
                <div className="compare-sub">avg HSI</div>
              </div>
              <div className="compare-change positive">
                <TrendingUp size={14} />
                +10.7%
              </div>
            </div>
          </div>

          {/* Weekly Insights */}
          <div className="card animate-in animate-in-delay-3" id="weekly-insights">
            <div className="card-label">Key Insights</div>
            <div className="card-title">What We Found</div>
            <div className="insights-list">
              {weeklyInsights.map((insight, i) => (
                <div key={i} className="insight-item">
                  <span className="insight-num">{i + 1}</span>
                  <p className="insight-text">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Chart - 7 day trend */}
          <div className="card animate-in animate-in-delay-4" id="weekly-trend-chart">
            <div className="card-label">7-Day Trend</div>
            <div className="card-title">State Index Over Time</div>
            <div className="weekly-trend">
              {[65, 70, 58, 72, 78, 85, 72].map((val, i) => (
                <div key={i} className="trend-col">
                  <div className="trend-bar-track">
                    <div className="trend-bar-fill" style={{ height: `${val}%` }} />
                  </div>
                  <span className="trend-day">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="report-actions animate-in animate-in-delay-5">
            <button className="btn btn-primary" id="download-weekly">
              <Download size={16} />
              Download Report
            </button>
            <button className="btn btn-secondary" id="share-weekly">
              <Share2 size={16} />
              Share
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
