'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const Clouds = dynamic(() => import('@/components/Clouds'), { ssr: false })

const STRENGTHS = [
  { min: 0, color: '#e8a0a0', label: 'Too short' },
  { min: 1, color: '#f59e0b', label: 'Weak' },
  { min: 2, color: '#f59e0b', label: 'Fair' },
  { min: 3, color: '#5a9e7a', label: 'Strong' },
  { min: 4, color: '#5a9e7a', label: 'Very strong' },
]

function getStrength(pwd) {
  let score = 0
  if (pwd.length >= 8) score++
  if (/[A-Z]/.test(pwd)) score++
  if (/[0-9]/.test(pwd)) score++
  if (/[^a-zA-Z0-9]/.test(pwd)) score++
  return score
}

export default function AuthPage() {
  const [tab, setTab] = useState('login')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [alert, setAlert] = useState({ show: false, msg: '', type: 'error' })
  const [toast, setToast] = useState({ show: false, msg: '' })
  const [pwdStrength, setPwdStrength] = useState(0)
  const [loginData, setLoginData] = useState({ email: '', password: '' })
  const [signupData, setSignupData] = useState({ fname: '', lname: '', email: '', password: '', role: 'counsellor' })

  const showAlert = (msg, type = 'error') => setAlert({ show: true, msg, type })
  const showToast = (msg) => { setToast({ show: true, msg }); setTimeout(() => setToast({ show: false, msg: '' }), 3500) }

  // ── CHECK IF EMAIL IS APPROVED ──
  const checkApproved = async (email) => {
    const { db } = await import('@/lib/firebase')
    const { collection, query, where, getDocs } = await import('firebase/firestore')
    const q = query(collection(db, 'approvedOfficials'), where('email', '==', email))
    const snapshot = await getDocs(q)
    return !snapshot.empty
  }

  // ── LOGIN ──
  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setAlert({ show: false })
    try {
      const { auth } = await import('@/lib/firebase')
      const { signInWithEmailAndPassword } = await import('firebase/auth')

      const userCredential = await signInWithEmailAndPassword(auth, loginData.email, loginData.password)
      const user = userCredential.user

      // Check if approved official
      const approved = await checkApproved(user.email)
      if (!approved) {
        await auth.signOut()
        showAlert('Access denied. You are not an approved official. Contact your admin.')
        setLoading(false)
        return
      }

      showToast('✓ Welcome back!')
      setTimeout(() => window.location.href = '/dashboard', 1200)

    } catch (err) {
      const msgs = {
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Try again.',
        'auth/invalid-email': 'Please enter a valid email.',
        'auth/too-many-requests': 'Too many attempts. Please wait.',
      }
      showAlert(msgs[err.code] || 'Sign in failed. Please try again.')
    } finally { setLoading(false) }
  }

  // ── SIGNUP ──
  const handleSignup = async (e) => {
    e.preventDefault()
    if (signupData.password.length < 8) return showAlert('Password must be at least 8 characters.')
    setLoading(true)
    setAlert({ show: false })
    try {
      // Check if email is approved BEFORE creating account
      const approved = await checkApproved(signupData.email)
      if (!approved) {
        showAlert('Access denied. Your email is not on the approved list. Contact your admin.')
        setLoading(false)
        return
      }

      const { auth } = await import('@/lib/firebase')
      const { createUserWithEmailAndPassword } = await import('firebase/auth')
      await createUserWithEmailAndPassword(auth, signupData.email, signupData.password)
      showToast('✓ Account created!')
      setTimeout(() => window.location.href = '/dashboard', 1200)

    } catch (err) {
      const msgs = {
        'auth/email-already-in-use': 'An account with this email already exists.',
        'auth/weak-password': 'Password is too weak.',
        'auth/invalid-email': 'Please enter a valid email.',
      }
      showAlert(msgs[err.code] || 'Sign up failed. Please try again.')
    } finally { setLoading(false) }
  }

  // ── GOOGLE ──
  const handleGoogle = async () => {
    try {
      const { auth, googleProvider } = await import('@/lib/firebase')
      const { signInWithPopup } = await import('firebase/auth')

      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      // Check if approved official
      const approved = await checkApproved(user.email)
      if (!approved) {
        await auth.signOut()
        showAlert('Access denied. Your Google account is not an approved official. Contact your admin.')
        return
      }

      showToast('✓ Signed in with Google!')
      setTimeout(() => window.location.href = '/dashboard', 1200)

    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') showAlert('Google sign-in failed.')
    }
  }

  // ── FORGOT PASSWORD ──
  const handleForgot = async () => {
    if (!loginData.email) return showAlert('Enter your email first.')
    try {
      const { auth } = await import('@/lib/firebase')
      const { sendPasswordResetEmail } = await import('firebase/auth')
      await sendPasswordResetEmail(auth, loginData.email)
      showAlert('Reset email sent! Check your inbox.', 'success')
    } catch { showAlert('Could not send reset email.') }
  }

  const roles = [
    { id: 'counsellor', icon: '🧑‍💼', title: 'Counsellor', desc: 'Support students directly' },
    { id: 'admin', icon: '⚙️', title: 'Administrator', desc: 'Full system access' },
    { id: 'coordinator', icon: '📋', title: 'Coordinator', desc: 'Placement office staff' },
    { id: 'manager', icon: '👔', title: 'Manager', desc: 'Oversee the team' },
  ]

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: `
          radial-gradient(ellipse 80% 60% at 20% 30%, rgba(255,120,170,0.4) 0%, transparent 60%),
          radial-gradient(ellipse 60% 50% at 80% 20%, rgba(255,180,210,0.3) 0%, transparent 55%),
          radial-gradient(ellipse 50% 60% at 60% 80%, rgba(240,64,138,0.2) 0%, transparent 55%),
          linear-gradient(160deg, #fff5f8 0%, #ffe0ee 40%, #fff2f8 100%)
        `,
      }} />
      <Clouds />

      {[
        { top: '10%', left: '5%', size: 300, hue: 330 },
        { top: '60%', right: '5%', size: 250, hue: 350 },
        { top: '30%', left: '60%', size: 200, hue: 315 },
      ].map((o, i) => (
        <div key={i} style={{
          position: 'fixed', top: o.top, left: o.left, right: o.right,
          width: o.size, height: o.size, borderRadius: '50%',
          background: `radial-gradient(circle, hsla(${o.hue},90%,80%,0.25) 0%, transparent 70%)`,
          filter: 'blur(30px)', zIndex: 0, pointerEvents: 'none',
          animation: `glow-pulse ${3 + i}s ease-in-out infinite`,
        }} />
      ))}

      <Link href="/" style={{
        position: 'fixed', top: 24, left: 32, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 8,
        color: '#d4547a', textDecoration: 'none', fontSize: 14, fontFamily: 'DM Sans, sans-serif',
        background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(10px)',
        border: '1px solid rgba(240,168,195,0.5)', borderRadius: 100,
        padding: '8px 18px', transition: 'all 0.2s',
      }}>← Back to CampusCare</Link>

      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: 1000, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'center' }}>

          {/* LEFT */}
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 100, marginBottom: 24, animation: 'sway 4s ease-in-out infinite', display: 'inline-block', filter: 'drop-shadow(0 12px 32px rgba(212,84,122,0.3))' }}>🌸</div>
            <h1 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 700, color: '#3d2c2c', lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 16 }}>
              Support the<br />students who<br /><em style={{ color: '#d4547a', fontStyle: 'italic' }}>need it most.</em>
            </h1>
            <p style={{ color: '#7a5c5c', fontSize: 15, fontWeight: 300, lineHeight: 1.7, maxWidth: 340, margin: '0 auto 36px' }}>
              Log in to access your college's student wellbeing dashboard — AI-prioritized, human-resolved.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340, margin: '0 auto' }}>
              {[
                { emoji: '😩', name: 'Aarav S.', text: 'Rejected from 8 companies…', score: 97, color: '#d4547a' },
                { emoji: '😰', name: 'Priya M.', text: 'Family pressure is too much…', score: 72, color: '#e8804a' },
                { emoji: '😔', name: 'Rohan G.', text: 'Feeling lost and anxious…', score: 38, color: '#5a9e7a' },
              ].map(({ emoji, name, text, score, color }, i) => (
                <div key={i} className="animate-float-card glass-card" style={{ borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, animationDelay: `${i * 0.5}s` }}>
                  <span style={{ fontSize: 22 }}>{emoji}</span>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div style={{ fontWeight: 500, fontSize: 13, color: '#3d2c2c' }}>{name}</div>
                    <div style={{ fontSize: 11, color: '#b08888' }}>{text}</div>
                  </div>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 600, color }}>{score}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 24, fontSize: 12, color: '#b08888', lineHeight: 1.6 }}>
              🔒 Restricted to verified college officials only
            </div>
          </div>

          {/* RIGHT — Auth card */}
          <div className="glass-card" style={{ borderRadius: 28, padding: 44 }}>
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 22, color: '#d4547a', marginBottom: 4 }}>🌸 CampusCare</div>
              <div style={{ fontSize: 13, color: '#b08888' }}>Official Portal</div>
            </div>

            <div style={{ display: 'flex', background: 'rgba(253,248,244,0.8)', border: '1.5px solid #f0d8d8', borderRadius: 14, padding: 4, marginBottom: 28 }}>
              {[['login', 'Sign In'], ['signup', 'Create Account']].map(([key, label]) => (
                <button key={key} onClick={() => { setTab(key); setAlert({ show: false }) }} style={{
                  flex: 1, padding: '10px', border: 'none', borderRadius: 10,
                  background: tab === key ? '#fff' : 'transparent',
                  color: tab === key ? '#d4547a' : '#7a5c5c',
                  fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  boxShadow: tab === key ? '0 2px 8px rgba(212,84,122,0.12)' : 'none',
                  transition: 'all 0.2s',
                }}>{label}</button>
              ))}
            </div>

            {alert.show && (
              <div style={{
                padding: '12px 14px', borderRadius: 10, fontSize: 13, marginBottom: 18,
                background: alert.type === 'error' ? 'rgba(212,84,122,0.1)' : 'rgba(90,158,122,0.1)',
                border: `1px solid ${alert.type === 'error' ? 'rgba(212,84,122,0.3)' : 'rgba(90,158,122,0.3)'}`,
                color: alert.type === 'error' ? '#d4547a' : '#5a9e7a',
              }}>{alert.msg}</div>
            )}

            <div style={{ background: 'rgba(212,84,122,0.06)', border: '1px solid #f9d0d0', borderRadius: 12, padding: '12px 14px', marginBottom: 22, fontSize: 13, color: '#7a5c5c', lineHeight: 1.6 }}>
              🔒 <strong style={{ color: '#d4547a' }}>Restricted access.</strong> Only approved officials can log in. Students submit from the main page.
            </div>

            <button onClick={handleGoogle} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              background: 'rgba(255,255,255,0.9)', border: '1.5px solid #f0d8d8',
              color: '#3d2c2c', fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500,
              padding: 13, borderRadius: 12, cursor: 'pointer',
              boxShadow: '0 2px 12px rgba(212,84,122,0.07)',
              transition: 'all 0.2s', marginBottom: 18,
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#e8a0a0'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(212,84,122,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0d8d8'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(212,84,122,0.07)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Institutional Google
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: '#f0d8d8' }} />
              <span style={{ fontSize: 12, color: '#b08888' }}>or with email</span>
              <div style={{ flex: 1, height: 1, background: '#f0d8d8' }} />
            </div>

            {tab === 'login' && (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 18 }}>
                  <label style={lbStyle}>Institutional Email</label>
                  <input type="email" placeholder="counsellor@nsut.ac.in" required
                    value={loginData.email} onChange={e => setLoginData(p => ({ ...p, email: e.target.value }))}
                    style={inpStyle} onFocus={applyFocus} onBlur={removeFocus} />
                </div>
                <div style={{ marginBottom: 6 }}>
                  <label style={lbStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPwd ? 'text' : 'password'} placeholder="Your password" required
                      value={loginData.password} onChange={e => setLoginData(p => ({ ...p, password: e.target.value }))}
                      style={{ ...inpStyle, paddingRight: 44 }} onFocus={applyFocus} onBlur={removeFocus} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#b08888' }}>
                      {showPwd ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <button type="button" onClick={handleForgot} style={{ display: 'block', textAlign: 'right', width: '100%', fontSize: 13, color: '#d4547a', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, fontFamily: 'DM Sans, sans-serif' }}>Forgot password?</button>
                <button type="submit" disabled={loading} className="btn-shimmer" style={submitStyle(loading)}>
                  {loading ? 'Verifying access…' : 'Sign In to Dashboard'}
                </button>
              </form>
            )}

            {tab === 'signup' && (
              <form onSubmit={handleSignup}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
                  {[['fname', 'First Name', 'Arjun'], ['lname', 'Last Name', 'Sharma']].map(([id, label, ph]) => (
                    <div key={id}>
                      <label style={lbStyle}>{label}</label>
                      <input type="text" placeholder={ph} required value={signupData[id]}
                        onChange={e => setSignupData(p => ({ ...p, [id]: e.target.value }))}
                        style={inpStyle} onFocus={applyFocus} onBlur={removeFocus} />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={lbStyle}>Work Email</label>
                  <input type="email" placeholder="you@nsut.ac.in" required value={signupData.email}
                    onChange={e => setSignupData(p => ({ ...p, email: e.target.value }))}
                    style={inpStyle} onFocus={applyFocus} onBlur={removeFocus} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={lbStyle}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPwd ? 'text' : 'password'} placeholder="Min. 8 characters" required
                      value={signupData.password}
                      onChange={e => { setSignupData(p => ({ ...p, password: e.target.value })); setPwdStrength(getStrength(e.target.value)) }}
                      style={{ ...inpStyle, paddingRight: 44 }} onFocus={applyFocus} onBlur={removeFocus} />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#b08888' }}>
                      {showPwd ? '🙈' : '👁'}
                    </button>
                  </div>
                  {signupData.password && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 100, background: i <= pwdStrength ? STRENGTHS[pwdStrength]?.color || '#f0d8d8' : '#f0d8d8', transition: 'background 0.3s' }} />
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ marginBottom: 18 }}>
                  <label style={lbStyle}>Your Role</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 6 }}>
                    {roles.map(({ id, icon, title, desc }) => (
                      <button key={id} type="button" onClick={() => setSignupData(p => ({ ...p, role: id }))} style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                        padding: '12px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                        border: signupData.role === id ? '2px solid #d4547a' : '1.5px solid #f0d8d8',
                        background: signupData.role === id ? 'rgba(212,84,122,0.07)' : 'rgba(253,248,244,0.8)',
                        fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s',
                      }}>
                        <span style={{ fontSize: 18, marginBottom: 4 }}>{icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: signupData.role === id ? '#d4547a' : '#3d2c2c' }}>{title}</span>
                        <span style={{ fontSize: 11, color: '#b08888', marginTop: 2 }}>{desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-shimmer" style={submitStyle(loading)}>
                  {loading ? 'Checking access…' : 'Create Account'}
                </button>
              </form>
            )}

            <p style={{ textAlign: 'center', fontSize: 12, color: '#b08888', marginTop: 16, lineHeight: 1.6 }}>
              By signing in you agree to our Terms of Service & Privacy Policy
            </p>
          </div>
        </div>
      </div>

      <div style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 999,
        background: 'rgba(255,255,255,0.95)', border: '1.5px solid #f0d8d8',
        borderRadius: 14, padding: '13px 20px', fontSize: 14, color: '#3d2c2c',
        boxShadow: '0 8px 32px rgba(212,84,122,0.15)',
        transform: toast.show ? 'translateY(0)' : 'translateY(100px)',
        opacity: toast.show ? 1 : 0,
        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>{toast.msg}</div>
    </div>
  )
}

const lbStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: '#7a5c5c', marginBottom: 7 }
const inpStyle = {
  width: '100%', background: 'rgba(253,248,244,0.8)', border: '1.5px solid #f0d8d8',
  borderRadius: 12, color: '#3d2c2c', fontFamily: 'DM Sans, sans-serif', fontSize: 15,
  padding: '12px 16px', outline: 'none', transition: 'all 0.2s',
}
const submitStyle = (loading) => ({
  width: '100%', background: 'linear-gradient(135deg, #d4547a, #f0408a)',
  color: '#fff', border: 'none', padding: '14px', borderRadius: 12,
  fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 500,
  cursor: loading ? 'not-allowed' : 'pointer',
  boxShadow: '0 6px 24px rgba(212,84,122,0.35)', opacity: loading ? 0.6 : 1,
  transition: 'transform 0.2s, box-shadow 0.2s', overflow: 'hidden', position: 'relative',
})
const applyFocus = (e) => { e.target.style.borderColor = '#d4547a'; e.target.style.boxShadow = '0 0 0 4px rgba(212,84,122,0.1)'; e.target.style.background = '#fff' }
const removeFocus = (e) => { e.target.style.borderColor = '#f0d8d8'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(253,248,244,0.8)' }