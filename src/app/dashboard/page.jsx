'use client'
import { useState, useEffect } from 'react'

const PC = { Urgent: { bg: 'rgba(212,84,122,0.1)', color: '#d4547a', border: 'rgba(212,84,122,0.25)' }, High: { bg: 'rgba(232,128,74,0.1)', color: '#e8804a', border: 'rgba(232,128,74,0.25)' }, Medium: { bg: 'rgba(212,160,84,0.1)', color: '#d4a054', border: 'rgba(212,160,84,0.25)' }, Low: { bg: 'rgba(90,158,122,0.1)', color: '#5a9e7a', border: 'rgba(90,158,122,0.25)' } }
const SC = { new: { bg: 'rgba(212,84,122,0.08)', color: '#d4547a', label: 'New' }, progress: { bg: 'rgba(212,160,84,0.08)', color: '#d4a054', label: 'In Progress' }, resolved: { bg: 'rgba(90,158,122,0.08)', color: '#5a9e7a', label: 'Resolved' } }
function avColor(n) { return ['#d4547a','#e8804a','#d4a054','#5a9e7a','#a06db0'][n?.charCodeAt(0) % 5] }

export default function Dashboard() {
  const [students, setStudents] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filterVal, setFilterVal] = useState('all')
  const [searchVal, setSearchVal] = useState('')
  const [analyticsOpen, setAnalyticsOpen] = useState(true)
  const [callModal, setCallModal] = useState(false)
  const [calling, setCalling] = useState(false)
  const [callSecs, setCallSecs] = useState(0)
  const [callLog, setCallLog] = useState([])
  const [clock, setClock] = useState('')
  const [activeNav, setActiveNav] = useState('queue')
  const [toast, setToast] = useState({ show: false, msg: '' })
  const [officialName, setOfficialName] = useState('Official')
  const [officialInitials, setOfficialInitials] = useState('CC')

  // ── CLOCK ──
  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST'), 1000)
    return () => clearInterval(t)
  }, [])

  // ── CALL TIMER ──
  useEffect(() => {
    let t
    if (calling) { t = setInterval(() => setCallSecs(s => s + 1), 1000) }
    return () => clearInterval(t)
  }, [calling])

  // ── GET LOGGED IN OFFICIAL NAME ──
  useEffect(() => {
    const getUser = async () => {
      const { auth } = await import('@/lib/firebase')
      const { onAuthStateChanged } = await import('firebase/auth')
      onAuthStateChanged(auth, (user) => {
        if (user) {
          const name = user.displayName || user.email?.split('@')[0] || 'Official'
          setOfficialName(name)
          setOfficialInitials(name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase())
        }
      })
    }
    getUser()
  }, [])

  // ── FETCH REAL DATA FROM FIRESTORE ──
  useEffect(() => {
    let unsubscribe
    const fetchData = async () => {
      try {
        const { db } = await import('@/lib/firebase')
        const { collection, onSnapshot, orderBy, query } = await import('firebase/firestore')

        const q = query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'))

        unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            // Format time
            time: doc.data().submittedAt?.toDate().toLocaleString('en-IN', {
              hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short'
            }) || 'Just now',
            // AI bars — placeholder until BERT is connected
            d: doc.data().score || 50,
            u: Math.min(100, (doc.data().score || 50) + 5),
            iso: Math.max(0, (doc.data().score || 50) - 10),
            conf: 85 + Math.floor(Math.random() * 12),
          }))
          setStudents(data)
          setLoadingData(false)
        })
      } catch (err) {
        console.error('Firestore error:', err)
        setLoadingData(false)
      }
    }
    fetchData()
    return () => { if (unsubscribe) unsubscribe() }
  }, [])

  // ── SIGN OUT ──
  const handleSignOut = async () => {
    const { auth } = await import('@/lib/firebase')
    const { signOut } = await import('firebase/auth')
    await signOut(auth)
    window.location.href = '/auth'
  }

  const showToast = (msg) => { setToast({ show: true, msg }); setTimeout(() => setToast({ show: false, msg: '' }), 3000) }
  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  // ── FILTER & SEARCH ──
  const filtered = students.filter(s => {
    const mf = filterVal === 'all' || (filterVal === 'resolved' ? s.status === 'resolved' : s.priority === filterVal)
    const sf = !searchVal || s.name?.toLowerCase().includes(searchVal) || s.college?.toLowerCase().includes(searchVal) || s.topic?.toLowerCase().includes(searchVal)
    return mf && sf
  })

  // ── STATS ──
  const totalEntries = students.length
  const urgentHigh = students.filter(s => s.priority === 'Urgent' || s.priority === 'High').length
  const avgScore = students.length ? Math.round(students.reduce((a, b) => a + (b.score || 0), 0) / students.length) : 0
  const resolved = students.filter(s => s.status === 'resolved').length

  // ── MARK RESOLVED IN FIRESTORE ──
  const markResolved = async () => {
    if (!selected) return
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc } = await import('firebase/firestore')
      await updateDoc(doc(db, 'submissions', selected.id), { status: 'resolved' })
      setSelected(s => ({ ...s, status: 'resolved' }))
      showToast('✅ Marked as resolved')
    } catch (err) {
      showToast('❌ Failed to update')
    }
  }

  // ── CALL ──
  const startCall = () => { setCalling(true); setCallSecs(0) }
  const endCall = async () => {
    setCalling(false)
    const dur = fmt(callSecs)
    setCallLog(l => [{ text: `Called by you — ${dur}`, time: 'just now' }, ...l])
    setCallModal(false)
    showToast(`📞 Call ended · ${dur}`)
    // Save call log to Firestore
    if (selected) {
      try {
        const { db } = await import('@/lib/firebase')
        const { doc, updateDoc, arrayUnion, serverTimestamp } = await import('firebase/firestore')
        await updateDoc(doc(db, 'submissions', selected.id), {
          callLog: arrayUnion({ duration: dur, calledAt: new Date().toISOString() }),
          status: 'progress'
        })
      } catch (err) { console.error('Call log error:', err) }
    }
  }

  return (
    <div style={{ height: '100vh', display: 'flex', overflow: 'hidden', background: '#fdf8f4', fontFamily: 'DM Sans, sans-serif' }}>

      {/* ── SIDEBAR ── */}
      <aside style={{ width: 256, flexShrink: 0, background: 'rgba(255,255,255,0.92)', borderRight: '1px solid #f0d8d8', display: 'flex', flexDirection: 'column', height: '100vh', backdropFilter: 'blur(12px)' }}>
        <div style={{ padding: '22px 20px', borderBottom: '1px solid #f0d8d8', fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 20, color: '#d4547a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ animation: 'sway 3s ease-in-out infinite', display: 'inline-block' }}>🌸</span> CampusCare
        </div>
        <div style={{ margin: '12px', padding: 14, background: '#fde8e8', border: '1px solid #f0d8d8', borderRadius: 14 }}>
          <div style={{ fontWeight: 500, fontSize: 13 }}>NSUT Delhi</div>
          <div style={{ fontSize: 11, color: '#b08888', marginTop: 2 }}>Support Counsellor Dashboard</div>
        </div>
        <div style={{ padding: '16px 14px 6px', fontSize: 10, color: '#b08888', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 500 }}>Students</div>
        {[
          { id: 'queue', icon: '💬', label: 'Live Entries', badge: String(students.filter(s => s.status === 'new').length), badgeColor: '#d4547a' },
          { id: 'urgent', icon: '🔥', label: 'Urgent Cases', badge: String(urgentHigh), badgeColor: '#d4547a' },
          { id: 'calls', icon: '📞', label: 'Call Log', badge: String(callLog.length), badgeColor: '#d4a054' },
          { id: 'resolved', icon: '✅', label: 'Resolved', badge: String(resolved), badgeColor: '#5a9e7a' },
        ].map(({ id, icon, label, badge, badgeColor }) => (
          <div key={id} onClick={() => setActiveNav(id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, margin: '2px 8px', cursor: 'pointer', color: activeNav === id ? '#d4547a' : '#7a5c5c', background: activeNav === id ? 'rgba(212,84,122,0.1)' : 'transparent', fontSize: 14, transition: 'all 0.15s' }}>
            <span style={{ width: 18, textAlign: 'center', fontSize: 16 }}>{icon}</span>
            <span style={{ flex: 1 }}>{label}</span>
            <span style={{ background: badgeColor, color: '#fff', fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 100 }}>{badge}</span>
          </div>
        ))}
        <div style={{ padding: '16px 14px 6px', fontSize: 10, color: '#b08888', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 500 }}>Analytics</div>
        {[{ id: 'insights', icon: '📊', label: 'Insights' }, { id: 'colleges', icon: '🏫', label: 'All Colleges' }, { id: 'settings', icon: '⚙️', label: 'Settings' }].map(({ id, icon, label }) => (
          <div key={id} onClick={() => setActiveNav(id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, margin: '2px 8px', cursor: 'pointer', color: activeNav === id ? '#d4547a' : '#7a5c5c', background: activeNav === id ? 'rgba(212,84,122,0.1)' : 'transparent', fontSize: 14, transition: 'all 0.15s' }}>
            <span style={{ fontSize: 16 }}>{icon}</span> {label}
          </div>
        ))}
        <div style={{ marginTop: 'auto', padding: 16, borderTop: '1px solid #f0d8d8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#d4547a,#e8a0a0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Playfair Display,serif', fontWeight: 600, fontSize: 14, color: '#fff' }}>{officialInitials}</div>
            <div><div style={{ fontSize: 13, fontWeight: 500 }}>{officialName}</div><div style={{ fontSize: 11, color: '#b08888' }}>Counsellor</div></div>
            <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: '#5a9e7a', boxShadow: '0 0 6px rgba(90,158,122,0.5)' }} />
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* TOPBAR */}
        <div style={{ padding: '15px 26px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid #f0d8d8', background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(12px)', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 17, fontWeight: 600 }}>Student Wellbeing Queue</div>
            <div style={{ fontSize: 12, color: '#b08888', marginTop: 1 }}>Live · {clock}</div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef3f0', border: '1.5px solid #f0d8d8', borderRadius: 12, padding: '8px 14px', minWidth: 220 }}>
              🔍 <input type="text" placeholder="Search by name, college…" value={searchVal} onChange={e => setSearchVal(e.target.value.toLowerCase())} style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#3d2c2c', width: '100%' }} />
            </div>
            {[['🔔', () => showToast('🌸 New entries received!')], ['📈', () => setAnalyticsOpen(o => !o)], ['🚪', handleSignOut]].map(([icon, fn], i) => (
              <button key={i} onClick={fn} style={{ width: 36, height: 36, borderRadius: 10, background: '#fef3f0', border: '1.5px solid #f0d8d8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, transition: 'all 0.2s' }} title={i === 2 ? 'Sign out' : ''}>{icon}</button>
            ))}
          </div>
        </div>

        {/* STATS — now real data */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', borderBottom: '1px solid #f0d8d8', flexShrink: 0, background: 'rgba(255,255,255,0.75)' }}>
          {[
            ['Total Entries', String(totalEntries), '↑ Live', '#d4547a', false],
            ['Urgent / High', String(urgentHigh), '↑ Needs attention', '#d4547a', true],
            ['Avg Score', String(avgScore), '→ AI scored', '#b08888', false],
            ['Calls Made', String(callLog.length), '↑ Today', '#5a9e7a', false],
            ['Resolved', String(resolved), '↑ Completed', '#5a9e7a', false],
          ].map(([lbl, val, delta, vc, hilight], i) => (
            <div key={i} style={{ padding: '18px 22px', borderRight: i < 4 ? '1px solid #f0d8d8' : 'none' }}>
              <div style={{ fontSize: 10, color: '#b08888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontWeight: 500 }}>{lbl}</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 600, color: hilight ? vc : '#3d2c2c', lineHeight: 1 }}>{val}</div>
              <div style={{ fontSize: 11, marginTop: 4, color: vc }}>{delta}</div>
            </div>
          ))}
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>

          {/* TABLE */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '22px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 16, fontWeight: 600 }}>Student Entries</div>
              <div style={{ display: 'flex', gap: 3, background: '#fef3f0', border: '1.5px solid #f0d8d8', borderRadius: 10, padding: 3 }}>
                {[['all','All'],['Urgent','Urgent'],['High','High'],['Medium','Medium'],['resolved','Resolved']].map(([v, l]) => (
                  <button key={v} onClick={() => setFilterVal(v)} style={{ padding: '6px 14px', border: 'none', borderRadius: 7, background: filterVal === v ? '#fff' : 'transparent', color: filterVal === v ? '#d4547a' : '#7a5c5c', fontFamily: 'DM Sans, sans-serif', fontSize: 13, cursor: 'pointer', boxShadow: filterVal === v ? '0 1px 4px rgba(212,84,122,0.1)' : 'none', transition: 'all 0.15s' }}>{l}</button>
                ))}
              </div>
              <select onChange={e => {
                const v = e.target.value
                setStudents(ss => [...ss].sort((a, b) => v === 'score' ? b.score - a.score : v === 'name' ? a.name?.localeCompare(b.name) : 0))
              }} style={{ marginLeft: 'auto', background: '#fef3f0', border: '1.5px solid #f0d8d8', color: '#7a5c5c', fontFamily: 'DM Sans, sans-serif', fontSize: 13, padding: '7px 12px', borderRadius: 10, outline: 'none', cursor: 'pointer' }}>
                <option value="score">Sort: Priority Score</option>
                <option value="time">Sort: Newest</option>
                <option value="name">Sort: Name A–Z</option>
              </select>
            </div>

            {/* LOADING STATE */}
            {loadingData ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 16 }}>
                <div style={{ fontSize: 40, animation: 'sway 2s ease-in-out infinite' }}>🌸</div>
                <div style={{ fontSize: 14, color: '#b08888' }}>Loading student entries…</div>
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
                <div style={{ fontSize: 40 }}>🌸</div>
                <div style={{ fontSize: 15, color: '#b08888' }}>No entries yet</div>
                <div style={{ fontSize: 13, color: '#d4c4c4' }}>Student submissions will appear here in real time</div>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 6px' }}>
                <thead>
                  <tr>{['#', 'Student', 'Feeling / Topic', 'College', 'Priority', 'Status', 'Score', 'Time'].map(h => (
                    <th key={h} style={{ fontSize: 11, color: '#b08888', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 500, padding: '0 12px 8px', textAlign: 'left' }}>{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => {
                    const isSel = selected?.id === s.id
                    const pc = PC[s.priority] || PC['Medium']
                    const sc = SC[s.status] || SC['new']
                    return (
                      <tr key={s.id} onClick={() => setSelected(s)} style={{ cursor: 'pointer' }}>
                        <td style={{ ...tdStyle(isSel, true, false), color: '#b08888', fontSize: 12 }}>{i + 1}</td>
                        <td style={tdStyle(isSel)}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: avColor(s.name), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
                              {s.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 500, fontSize: 13 }}>{s.name}</div>
                              <div style={{ fontSize: 11, color: '#b08888' }}>{s.year}</div>
                            </div>
                          </div>
                        </td>
                        <td style={tdStyle(isSel)}>
                          <div style={{ fontSize: 15 }}>{s.mood} <span style={{ fontSize: 13, color: '#7a5c5c' }}>{s.mood}</span></div>
                          <div style={{ fontSize: 11, color: '#b08888', marginTop: 2 }}>{s.topic}</div>
                        </td>
                        <td style={{ ...tdStyle(isSel), fontSize: 13, color: '#7a5c5c' }}>{s.college}</td>
                        <td style={tdStyle(isSel)}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', background: pc.bg, color: pc.color, border: `1px solid ${pc.border}` }}>{s.priority}</span>
                        </td>
                        <td style={tdStyle(isSel)}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 100, fontSize: 11, background: sc.bg, color: sc.color }}>{sc.label}</span>
                        </td>
                        <td style={tdStyle(isSel)}>
                          <span style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 600, color: pc.color }}>{s.score}</span>
                        </td>
                        <td style={{ ...tdStyle(isSel, false, true), fontSize: 12, color: '#b08888' }}>{s.time}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* DRAWER */}
          {selected && (
            <div style={{ width: 360, flexShrink: 0, borderLeft: '1px solid #f0d8d8', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(16px)', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              <div style={{ padding: '18px 20px 0', borderBottom: '1px solid #f0d8d8', flexShrink: 0 }}>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: '#b08888', fontSize: 13, cursor: 'pointer', marginBottom: 12, fontFamily: 'DM Sans, sans-serif' }}>← Back to queue</button>
                <div style={{ fontSize: 36, marginBottom: 6 }}>{selected.mood || '😔'}</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{selected.name}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, paddingBottom: 14 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, background: (PC[selected.priority] || PC['Medium']).bg, color: (PC[selected.priority] || PC['Medium']).color, border: `1px solid ${(PC[selected.priority] || PC['Medium']).border}` }}>{selected.priority}</span>
                  <span style={{ fontSize: 12, color: '#b08888' }}>Score: <strong style={{ color: (PC[selected.priority] || PC['Medium']).color }}>{selected.score}</strong></span>
                  <span style={{ fontSize: 12, color: '#b08888' }}>{selected.time}</span>
                </div>
              </div>

              <div style={{ padding: '18px 20px', flex: 1 }}>
                <Dlabel>What they shared</Dlabel>
                <div style={{ background: '#fef3f0', border: '1.5px solid #f0d8d8', borderRadius: 14, padding: 16, fontSize: 13, lineHeight: 1.75, color: '#7a5c5c', marginBottom: 18, fontStyle: 'italic' }}>"{selected.text}"</div>

                <Dlabel>AI Sentiment Analysis</Dlabel>
                <div style={{ background: '#fef3f0', border: '1.5px solid #f0d8d8', borderRadius: 14, padding: 16, marginBottom: 18 }}>
                  {[
                    ['Distress Level', selected.distress_level || selected.d || 0, '#d4547a'],
                    ['Urgency', selected.urgency || selected.u || 0, '#e8804a'],
                    ['Isolation Risk', selected.isolation_risk || selected.iso || 0, '#d4a054'],
                    ['Confidence', selected.confidence || selected.conf || 0, '#5a9e7a']
                  ].map(([k, v, c]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <span style={{ fontSize: 12, color: '#b08888', width: 110, flexShrink: 0 }}>{k}</span>
                      <div style={{ flex: 1, height: 5, background: 'rgba(212,84,122,0.1)', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: (v || 0) + '%', background: c, borderRadius: 100, transition: 'width 1s ease' }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 500, minWidth: 34, textAlign: 'right', fontFamily: 'Playfair Display, serif' }}>{v || 0}%</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(212,84,122,0.05)', borderRadius: 8, fontSize: 11, color: '#b08888', textAlign: 'center' }}>
                    🧠 BERT + XGBoost analysis coming in next update
                  </div>
                </div>

                <Dlabel>Contact Details</Dlabel>
                <div style={{ background: '#fef3f0', border: '1.5px solid #f0d8d8', borderRadius: 14, padding: '12px 14px', marginBottom: 18 }}>
                  {[['Name', selected.name], ['Phone', selected.phone], ['College', selected.college], ['Year', selected.year], ['Topic', selected.topic], ['Call Time', selected.calltime]].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #f0d8d8', fontSize: 13 }}>
                      <span style={{ color: '#b08888', width: 70, flexShrink: 0, fontSize: 12 }}>{k}</span>
                      <span style={{ fontWeight: 500, color: '#3d2c2c' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {callLog.length > 0 && (
                  <>
                    <Dlabel>Call History</Dlabel>
                    {callLog.map((l, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #f0d8d8', fontSize: 12 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#5a9e7a', flexShrink: 0 }} />
                        <span style={{ flex: 1, color: '#7a5c5c' }}>{l.text}</span>
                        <span style={{ color: '#b08888' }}>{l.time}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>

              <div style={{ padding: '14px 18px', borderTop: '1px solid #f0d8d8', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                <button onClick={() => { setCallModal(true); setCalling(false); setCallSecs(0) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(135deg,#d4547a,#f0408a)', color: '#fff', border: 'none', padding: 13, borderRadius: 13, fontFamily: 'DM Sans,sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer', boxShadow: '0 6px 20px rgba(212,84,122,0.35)' }}>📞 Call Student Now</button>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[['✅ Resolve', markResolved], ['📝 Note', () => showToast('📝 Note saved')], ['🔴 Escalate', () => showToast('🔴 Escalated to admin')]].map(([label, fn]) => (
                    <button key={label} onClick={fn} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, background: '#fef3f0', border: '1.5px solid #f0d8d8', color: '#7a5c5c', padding: 9, borderRadius: 11, fontFamily: 'DM Sans,sans-serif', fontSize: 13, cursor: 'pointer' }}>{label}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ANALYTICS */}
          {analyticsOpen && (
            <div style={{ width: 230, flexShrink: 0, borderLeft: '1px solid #f0d8d8', background: 'rgba(255,255,255,0.85)', overflowY: 'auto', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <Alabel>Priority Split</Alabel>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                  <svg width="100" height="100" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="36" fill="none" stroke="#fde8e8" strokeWidth="16"/>
                    <circle cx="50" cy="50" r="36" fill="none" stroke="#d4547a" strokeWidth="16" strokeDasharray="70 156" strokeDashoffset="25" strokeLinecap="round"/>
                    <circle cx="50" cy="50" r="36" fill="none" stroke="#e8804a" strokeWidth="16" strokeDasharray="50 176" strokeDashoffset="-45" strokeLinecap="round"/>
                    <circle cx="50" cy="50" r="36" fill="none" stroke="#d4a054" strokeWidth="16" strokeDasharray="70 156" strokeDashoffset="-95" strokeLinecap="round"/>
                    <circle cx="50" cy="50" r="36" fill="none" stroke="#5a9e7a" strokeWidth="16" strokeDasharray="36 190" strokeDashoffset="-165" strokeLinecap="round"/>
                    <text x="50" y="53" textAnchor="middle" fontFamily="Playfair Display" fontSize="14" fontWeight="600" fill="#3d2c2c">{totalEntries}</text>
                  </svg>
                  {[['#d4547a','Urgent', students.filter(s=>s.priority==='Urgent').length],['#e8804a','High',students.filter(s=>s.priority==='High').length],['#d4a054','Medium',students.filter(s=>s.priority==='Medium').length],['#5a9e7a','Low',students.filter(s=>s.priority==='Low').length]].map(([c,l,v]) => (
                    <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, width: '100%' }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: c, flexShrink: 0 }} />
                      <span style={{ flex: 1, color: '#7a5c5c' }}>{l}</span>
                      <span style={{ fontFamily: 'Playfair Display,serif', fontWeight: 600, color: '#3d2c2c' }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Alabel>My Stats</Alabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[[String(resolved),'Resolved','#5a9e7a'],[String(callLog.length),'Calls','#d4547a'],[String(urgentHigh),'Urgent','#e8804a'],[String(totalEntries),'Total','#d4a054']].map(([v,l,c]) => (
                    <div key={l} style={{ background: '#fef3f0', border: '1px solid #f0d8d8', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'Playfair Display,serif', fontSize: 18, fontWeight: 600, color: c, marginBottom: 2 }}>{v}</div>
                      <div style={{ fontSize: 10, color: '#b08888', lineHeight: 1.3 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CALL MODAL */}
      {callModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(253,232,232,0.75)', backdropFilter: 'blur(14px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', border: '1.5px solid #f0d8d8', borderRadius: 24, width: 360, padding: 36, position: 'relative', boxShadow: '0 20px 60px rgba(212,84,122,0.18)' }}>
            <button onClick={() => { setCallModal(false); setCalling(false) }} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 18, color: '#b08888', cursor: 'pointer' }}>✕</button>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg,#d4547a,#e8a0a0)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 20px' }}>🌸</div>
            {!calling ? (
              <>
                <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: 22, fontWeight: 600, color: '#3d2c2c', textAlign: 'center', marginBottom: 4 }}>{selected?.name}</h3>
                <p style={{ fontSize: 13, color: '#7a5c5c', textAlign: 'center', marginBottom: 22 }}>{selected?.topic}</p>
                {[['📱 Phone', selected?.phone], ['🏫 College', selected?.college], ['🏷️ Priority', `${selected?.score}/100 — ${selected?.priority}`], ['😔 Mood', selected?.mood]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fef3f0', borderRadius: 10, marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: '#b08888' }}>{k}</span>
                    <span style={{ fontWeight: 500, color: '#3d2c2c' }}>{v}</span>
                  </div>
                ))}
                <button onClick={startCall} style={{ width: '100%', background: 'linear-gradient(135deg,#d4547a,#f0408a)', color: '#fff', border: 'none', padding: 14, borderRadius: 13, fontFamily: 'DM Sans,sans-serif', fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 16, boxShadow: '0 6px 24px rgba(212,84,122,0.35)' }}>📞 Start Call</button>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontFamily: 'Playfair Display,serif', fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Calling…</h3>
                <p style={{ fontSize: 13, color: '#7a5c5c', marginBottom: 14 }}>{selected?.name}</p>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center', margin: '10px 0' }}>
                  {[0, 0.15, 0.3].map((d, i) => <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#d4547a', display: 'inline-block', animation: `dot-bounce 0.8s ${d}s ease-in-out infinite` }} />)}
                </div>
                <div style={{ margin: '16px 0', padding: '12px', background: '#fef3f0', borderRadius: 10, fontSize: 13, color: '#7a5c5c' }}>
                  Duration: <span style={{ fontFamily: 'Playfair Display,serif', fontWeight: 600, color: '#d4547a' }}>{fmt(callSecs)}</span>
                </div>
                <button onClick={endCall} style={{ width: '100%', background: 'rgba(212,84,122,0.08)', border: '1.5px solid rgba(212,84,122,0.3)', color: '#d4547a', padding: 12, borderRadius: 13, fontFamily: 'DM Sans,sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>📵 End Call</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOAST */}
      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: `translateX(-50%) translateY(${toast.show ? 0 : 100}px)`, opacity: toast.show ? 1 : 0, background: 'rgba(255,255,255,0.95)', border: '1.5px solid #f0d8d8', borderRadius: 14, padding: '12px 22px', fontSize: 13, color: '#3d2c2c', boxShadow: '0 8px 32px rgba(212,84,122,0.15)', transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)', zIndex: 9999, whiteSpace: 'nowrap' }}>
        {toast.msg}
      </div>
    </div>
  )
}

const tdStyle = (sel, first = false, last = false) => ({
  padding: '14px 12px',
  borderTop: '1px solid #f0d8d8', borderBottom: '1px solid #f0d8d8',
  background: sel ? '#fff' : 'rgba(255,255,255,0.85)',
  ...(first ? { borderLeft: `1.5px solid ${sel ? '#d4547a' : '#f0d8d8'}`, borderRadius: '14px 0 0 14px', paddingLeft: 16 } : {}),
  ...(last ? { borderRight: '1px solid #f0d8d8', borderRadius: '0 14px 14px 0', paddingRight: 16 } : {}),
  transition: 'background 0.15s',
})

const Dlabel = ({ children }) => <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#b08888', fontWeight: 500, marginBottom: 10 }}>{children}</div>
const Alabel = ({ children }) => <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#b08888', marginBottom: 12, fontWeight: 500 }}>{children}</div>