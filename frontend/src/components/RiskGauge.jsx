import React from 'react';

export default function RiskGauge({ score = 0, delta = 0, grade = 'B' }) {
  // Score is 0 - 100
  const normalizedScore = Math.min(100, Math.max(0, score));
  
  // Calculate SVG circular arc
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference * 0.75; // 270 degree arc

  let color = 'var(--sev-safe)';
  let glowColor = 'var(--shadow-glow-green)';
  if (normalizedScore >= 75) {
    color = 'var(--sev-critical)';
    glowColor = 'var(--shadow-glow-red)';
  } else if (normalizedScore >= 45) {
    color = 'var(--sev-high)';
    glowColor = 'rgba(249, 115, 22, 0.3)';
  } else if (normalizedScore >= 25) {
    color = 'var(--sev-medium)';
    glowColor = 'rgba(234, 179, 8, 0.3)';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      <svg width="220" height="200" viewBox="0 0 220 200">
        {/* Background Track Arc */}
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke="#1e293b"
          strokeWidth="14"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform="rotate(135 110 110)"
        />

        {/* Foreground Progress Arc */}
        <circle
          cx="110"
          cy="110"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeDasharray={`${circumference * 0.75} ${circumference * 0.25}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(135 110 110)"
          style={{
            transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.5s ease',
            filter: `drop-shadow(0 0 10px ${color})`
          }}
        />
      </svg>

      {/* Center Text Readout */}
      <div style={{
        position: 'absolute',
        top: '65px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#fff', lineHeight: 1 }}>
          {normalizedScore}
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '4px' }}>
          POSTURE RISK
        </div>
        <div style={{
          marginTop: '6px',
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: `1px solid ${color}`,
          fontSize: '0.75rem',
          fontWeight: 700,
          color: color
        }}>
          GRADE {grade || 'B'}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '-15px', fontSize: '0.75rem' }}>
        <span style={{ color: delta <= 0 ? 'var(--sev-safe)' : 'var(--sev-critical)' }}>
          {delta <= 0 ? `▼ ${Math.abs(delta)}%` : `▲ +${delta}%`}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>vs 24h ago</span>
      </div>
    </div>
  );
}
