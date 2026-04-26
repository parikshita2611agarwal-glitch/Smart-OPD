import React, { useState, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './App.css';
import { messages } from './locales/messages';
import { useSocket } from './hooks/useSocket';

// ── Utility ──────────────────────────────────────────────────────────────────

function t(lang, key) {
  return messages[lang]?.[key] || messages.en[key] || key;
}

function Badge({ level, lang }) {
  const labelMap = { HIGH: t(lang,'high'), MEDIUM: t(lang,'medium'), LOW: t(lang,'low') };
  return (
    <span className={`badge badge-${level}`}>
      <span className="badge-dot" />
      {labelMap[level] || level}
    </span>
  );
}

function Spinner() {
  return <div className="spinner" />;
}

// ── Stats Bar ─────────────────────────────────────────────────────────────────

function StatsBar({ stats, lang }) {
  return (
    <div className="stats-row">
      <div className="stat-card">
        <div className="stat-val">{stats.total}</div>
        <div className="stat-lbl">{t(lang,'waitingPatients')}</div>
      </div>
      <div className="stat-card">
        <div className="stat-val high">{stats.high}</div>
        <div className="stat-lbl">{t(lang,'high')}</div>
      </div>
      <div className="stat-card">
        <div className="stat-val med">{stats.medium}</div>
        <div className="stat-lbl">{t(lang,'medium')}</div>
      </div>
      <div className="stat-card">
        <div className="stat-val" style={{ fontSize: '1.4rem', color: 'var(--accent2)' }}>
          {stats.nextToken || '—'}
        </div>
        <div className="stat-lbl">{t(lang,'nextToken')}</div>
      </div>
    </div>
  );
}

// ── Token Result Card ──────────────────────────────────────────────────────────

function ResultCard({ patient, lang }) {
  if (!patient) return null;
  const qrData = JSON.stringify({
    token: patient.tokenDisplay,
    patient: patient.patientName,
    dept: patient.department,
    priority: patient.urgency_level,
  });

  return (
    <div className="result-card">
      <div className="result-header">
        <div className="token-display">
          <span className="token-label">{t(lang, 'yourToken')}</span>
          <span className="token-number">{patient.tokenDisplay}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
          <Badge level={patient.urgency_level} lang={lang} />
          <div className="qr-wrapper">
            <QRCodeSVG value={qrData} size={60} bgColor="transparent" fgColor="var(--text2)" level="L" />
            <span className="qr-label">{t(lang, 'qrCode')}</span>
          </div>
        </div>
      </div>

      <div className="result-body">
        <div className="result-section">
          <div className="result-section-label">{t(lang, 'condition')}</div>
          <div className="result-section-val">{patient.condition}</div>
        </div>
        <div className="result-section">
          <div className="result-section-label">{t(lang, 'department')}</div>
          <div className="result-section-val">{patient.department}</div>
        </div>
        <div className="result-section" style={{ gridColumn: '1 / -1' }}>
          <div className="result-section-label">{t(lang, 'summary')}</div>
          <div className="result-section-val" style={{ color: 'var(--text2)' }}>{patient.summary}</div>
        </div>
      </div>

      <div className="result-footer">
        <span className="wait-label">
          {t(lang, 'estimatedWait')}
        </span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
          <span className="wait-val">{patient.waitMinutes}</span>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>{t(lang, 'minutes')}</span>
        </span>
      </div>
    </div>
  );
}

// ── Patient Intake Panel ───────────────────────────────────────────────────────

function PatientPanel({ lang, stats }) {
  const [symptoms, setSymptoms] = useState('');
  const [abhaId, setAbhaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const startVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError(t(lang, 'voiceUnsupported')); return; }
    if (listening) { recognitionRef.current?.stop(); return; }

    const r = new SR();
    r.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    r.interimResults = false;
    recognitionRef.current = r;
    setListening(true);
    setError('');

    r.onresult = (e) => {
      setSymptoms(e.results[0][0].transcript);
      setListening(false);
    };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    r.start();
  }, [lang, listening]);

  const submit = async () => {
    if (!symptoms.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptoms.trim(),
          language: lang === 'hi' ? 'Hindi' : 'English',
          abhaId: abhaId.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t(lang, 'errorTryAgain'));
      setResult(data.patient);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setSymptoms('');
    setAbhaId('');
    setError('');
  };

  if (result) {
    return (
      <div>
        <StatsBar stats={stats} lang={lang} />
        <ResultCard patient={result} lang={lang} />
        <div style={{ marginTop: 14 }}>
          <button className="btn-secondary" onClick={reset}>← {t(lang, 'newPatient')}</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <StatsBar stats={stats} lang={lang} />
      <div className="form-card">
        <div className="form-title">{t(lang, 'patientTab')}</div>

        <div className="field-group">
          <label className="field-label">{t(lang, 'symptomsLabel')}</label>
          <div className="input-row">
            <textarea
              value={symptoms}
              onChange={e => setSymptoms(e.target.value)}
              placeholder={t(lang, 'symptomsPlaceholder')}
              rows={4}
            />
            <button
              className={`btn-voice${listening ? ' listening' : ''}`}
              onClick={startVoice}
              title={t(lang, 'voiceBtn')}
            >
              🎤
            </button>
          </div>
          {listening && <div className="voice-hint" style={{ marginTop: 6, color: 'var(--high)' }}>{t(lang, 'listening')}</div>}
        </div>

        <div className="field-group">
          <label className="field-label">{t(lang, 'abhaLabel')}</label>
          <input
            type="text"
            value={abhaId}
            onChange={e => setAbhaId(e.target.value)}
            placeholder={t(lang, 'abhaPlaceholder')}
            maxLength={14}
          />
        </div>

        <div className="form-actions">
          <button
            className="btn-primary"
            onClick={submit}
            disabled={loading || !symptoms.trim()}
          >
            {t(lang, 'submitBtn')}
          </button>
        </div>

        {loading && (
          <div className="loading-row">
            <Spinner />
            {t(lang, 'analyzing')}
          </div>
        )}

        {error && <div className="error-box">{error}</div>}
      </div>
    </div>
  );
}

// ── Doctor Dashboard ───────────────────────────────────────────────────────────

function DoctorPanel({ queue, stats, lang, callPatient }) {
  const sorted = [...queue].sort((a, b) => {
    const order = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return (order[a.urgency_level] - order[b.urgency_level]) || (a.arrivedAt - b.arrivedAt);
  });

  return (
    <div>
      <StatsBar stats={stats} lang={lang} />
      <div className="queue-card">
        <div className="queue-header">
          <div className="queue-title">{t(lang, 'queueTitle')}</div>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{sorted.length} patients</span>
        </div>
        {sorted.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏥</div>
            {t(lang, 'noPatients')}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t(lang, 'tokenCol')}</th>
                <th>{t(lang, 'patientCol')}</th>
                <th>{t(lang, 'priorityCol')}</th>
                <th>{t(lang, 'conditionCol')}</th>
                <th>{t(lang, 'deptCol')}</th>
                <th>{t(lang, 'waitCol')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(p => (
                <tr
                  key={p.token}
                  className={`priority-${p.urgency_level === 'HIGH' ? 'high' : p.urgency_level === 'MEDIUM' ? 'medium' : ''}`}
                >
                  <td className="token-cell">{p.tokenDisplay}</td>
                  <td>{p.patientName}</td>
                  <td><Badge level={p.urgency_level} lang={lang} /></td>
                  <td className="condition-cell" title={p.condition}>{p.condition}</td>
                  <td className="dept-cell">{p.department}</td>
                  <td className="wait-cell">{p.waitMinutes} {t(lang, 'minutes')}</td>
                  <td>
                    <button className="btn-call" onClick={() => callPatient(p.token)}>
                      {t(lang, 'callBtn')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── App Shell ──────────────────────────────────────────────────────────────────

export default function App() {
  const [lang, setLang] = useState('en');
  const [view, setView] = useState('patient');
  const { queue, stats, connected, callPatient } = useSocket();

  const statusLabel = connected ? t(lang, 'connectedLive') : t(lang, 'disconnected');

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-icon">🏥</div>
          <div>
            <div className="brand-name">{t(lang, 'appTitle')}</div>
            <div className="brand-sub">{t(lang, 'appSubtitle')}</div>
          </div>
        </div>
        <div className="topbar-right">
          <div className={`status-dot${connected ? ' live' : ''}`}>{statusLabel}</div>
          <div className="lang-switch">
            <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>EN</button>
            <button className={`lang-btn${lang === 'hi' ? ' active' : ''}`} onClick={() => setLang('hi')}>हि</button>
          </div>
        </div>
      </header>

      <div className="main">
        <nav className="sidebar">
          <button
            className={`nav-item${view === 'patient' ? ' active' : ''}`}
            onClick={() => setView('patient')}
          >
            <span className="nav-icon">👤</span>
            {t(lang, 'patientTab')}
          </button>
          <button
            className={`nav-item${view === 'doctor' ? ' active' : ''}`}
            onClick={() => setView('doctor')}
          >
            <span className="nav-icon">🩺</span>
            {t(lang, 'doctorTab')}
          </button>
          <div className="nav-divider" />
          <div style={{ padding: '8px 20px' }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Queue</div>
            <div style={{ display: 'flex', gap: 6, flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)' }}>
                <span style={{ color: 'var(--high)' }}>■</span>
                <span>HIGH</span>
                <span style={{ color: 'var(--high)', fontWeight: 500 }}>{stats.high}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)' }}>
                <span style={{ color: 'var(--med)' }}>■</span>
                <span>MED</span>
                <span style={{ color: 'var(--med)', fontWeight: 500 }}>{stats.medium}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)' }}>
                <span style={{ color: 'var(--low)' }}>■</span>
                <span>LOW</span>
                <span style={{ color: 'var(--low)', fontWeight: 500 }}>{stats.low}</span>
              </div>
            </div>
          </div>
        </nav>

        <main className="content">
          {view === 'patient' && <PatientPanel lang={lang} stats={stats} />}
          {view === 'doctor' && <DoctorPanel queue={queue} stats={stats} lang={lang} callPatient={callPatient} />}
        </main>
      </div>
    </div>
  );
}
