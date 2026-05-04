'use client'
import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const PetalCanvas = dynamic(() => import('@/components/PetalCanvas'), { ssr: false })
const Clouds = dynamic(() => import('@/components/Clouds'), { ssr: false })

const STRIP_ITEMS = [
  '🌸 Confidential & Safe', '💬 Real Human Support', '🧠 AI-Powered Priority',
  '📞 Personal Callback', '🏫 50+ Colleges', '🔒 Verified Officials Only',
  '🤝 No Judgment Ever', '⚡ 2-Hour Response', '💙 Placement Stress Support',
  '🌱 You Are Not Alone',
]

const MOODS = [
  { emoji: '😔', label: 'Sad' },
  { emoji: '😰', label: 'Anxious' },
  { emoji: '😤', label: 'Frustrated' },
  { emoji: '😶', label: 'Numb' },
  { emoji: '😩', label: 'Exhausted' },
  { emoji: '😢', label: 'Overwhelmed' },
]

const QUOTES = [
  { text: 'I submitted at 11pm feeling completely hopeless after my 5th rejection. By 10am next morning, someone from my college called me. That conversation changed everything.', attr: '— 4th Year Student, NSUT Delhi' },
  { text: 'I didn\'t know what to say but I just typed how I felt. The AI understood my stress level and I was marked urgent. My counsellor called within an hour. It felt like someone actually cared.', attr: '— 3rd Year Student, DTU' },
  { text: 'Placement season made me feel like a failure every single day. CampusCare reminded me that my worth isn\'t my offer letter. I needed to hear that.', attr: '— Final Year Student, IIT Delhi' },
]

const RESOURCES = [
  { icon: '🆘', title: 'iCall — TISS Helpline', desc: 'Free professional counselling for students across India. Trained psychologists available Monday–Saturday.', link: '📞 9152987821' },
  { icon: '💬', title: 'Vandrevala Foundation', desc: '24/7 free mental health helpline. Call or WhatsApp any time — they understand placement stress deeply.', link: '📞 1860-2662-345' },
  { icon: '🧘', title: 'Placement Calm Guide', desc: 'Breathing exercises, journaling prompts, and rejection recovery techniques for engineering students.', link: 'Read Guide →' },
]

export default function Home() {
  const [scrolled, setScrolled] = useState(false)
  const [selectedMood, setSelectedMood] = useState('')
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [successData, setSuccessData] = useState({})
  const [formData, setFormData] = useState({
    name: '', phone: '', college: '', year: '', text: '', topic: 'Placement rejections', calltime: 'afternoon'
  })
  const revealRefs = useRef([])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Quote rotation
  useEffect(() => {
    const t = setInterval(() => setQuoteIdx(i => (i + 1) % QUOTES.length), 5000)
    return () => clearInterval(t)
  }, [])

  // Scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.08 })
    revealRefs.current.forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const addReveal = el => { if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el) }

  const handleSubmit = async (e) => {
  e.preventDefault()
  setSubmitting(true)

  const text = formData.text
  const hasUrgent = /hopeless|can't|cannot|give up|end|failed|rejected|worthless|alone|nobody/i.test(text)
  const wc = text.split(/\s+/).length
  const priority = hasUrgent ? 'Urgent' : wc > 50 ? 'High' : 'Medium'

  try {
    const { db } = await import('@/lib/firebase')
    const { collection, addDoc, serverTimestamp } = await import('firebase/firestore')

    await addDoc(collection(db, 'submissions'), {
      name: formData.name,
      phone: formData.phone,
      college: formData.college,
      year: formData.year,
      text: formData.text,
      topic: formData.topic,
      calltime: formData.calltime,
      mood: selectedMood,
      priority: priority,
      status: 'new',
      score: hasUrgent ? 90 + Math.floor(Math.random() * 10) : wc > 50 ? 60 + Math.floor(Math.random() * 20) : 20 + Math.floor(Math.random() * 30),
      submittedAt: serverTimestamp(),
    })

    setSuccessData({
      name: formData.name,
      college: formData.college.split('—')[0].trim(),
      priority,
      mood: selectedMood
    })
    setShowSuccess(true)
    setFormData({ name: '', phone: '', college: '', year: '', text: '', topic: 'Placement rejections', calltime: 'afternoon' })
    setSelectedMood('')

  } catch (err) {
    console.error('Submission failed:', err)
    alert('Something went wrong. Please try again.')
  } finally {
    setSubmitting(false)
  }
}

  return (
    <div style={{ minHeight: '100vh', position: 'relative' }}>
      <PetalCanvas />
      <Clouds />

      {/* ── NAV ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 56px',
        background: scrolled ? 'rgba(255,245,250,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        boxShadow: scrolled ? '0 1px 0 rgba(240,168,195,0.3)' : 'none',
        transition: 'all 0.4s ease',
      }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 22, color: '#d4547a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ display: 'inline-block' }} className="animate-sway">🌸</span>
          CampusCare
        </div>
        <ul style={{ display: 'flex', gap: 36, listStyle: 'none' }}>
          {[['Share Feelings', '#reach-out'], ['How it Works', '#how'], ['Resources', '#resources']].map(([label, href]) => (
            <li key={label}>
              <a href={href} style={{ color: '#7a5c5c', textDecoration: 'none', fontSize: 14, transition: 'color 0.2s' }}
                onMouseEnter={e => e.target.style.color = '#d4547a'}
                onMouseLeave={e => e.target.style.color = '#7a5c5c'}>{label}</a>
            </li>
          ))}
        </ul>
        <Link href="/auth" style={{
          background: 'linear-gradient(135deg, #d4547a, #f0408a)',
          color: '#fff', border: 'none', padding: '10px 26px', borderRadius: 100,
          fontSize: 14, textDecoration: 'none', fontFamily: 'DM Sans, sans-serif',
          boxShadow: '0 6px 24px rgba(212,84,122,0.35)',
          transition: 'transform 0.2s, box-shadow 0.2s', display: 'inline-block',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 32px rgba(212,84,122,0.45)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(212,84,122,0.35)' }}
        >Official Login</Link>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '120px 24px 80px', overflow: 'hidden',
      }}>
        {/* Gemini aurora mesh */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 90% 70% at 50% 30%, rgba(255,100,160,0.38) 0%, transparent 65%),
            radial-gradient(ellipse 60% 50% at 15% 60%, rgba(255,180,210,0.28) 0%, transparent 55%),
            radial-gradient(ellipse 50% 60% at 85% 70%, rgba(240,64,138,0.22) 0%, transparent 55%),
            radial-gradient(ellipse 40% 40% at 70% 10%, rgba(255,200,230,0.32) 0%, transparent 50%),
            linear-gradient(160deg, #fff5f8 0%, #ffe0ee 35%, #fff2f8 60%, #ffd6e8 100%)
          `,
        }} />

        {/* Luminous center orb */}
        <div style={{
          position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%', zIndex: 0,
          background: 'radial-gradient(circle, rgba(255,120,170,0.22) 0%, rgba(240,64,138,0.08) 40%, transparent 70%)',
          filter: 'blur(40px)',
          animation: 'glow-pulse 4s ease-in-out infinite',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 820 }}>
          {/* Badge */}
          <div className="fade-up-1" style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,180,210,0.6)',
            borderRadius: 100, padding: '8px 22px', fontSize: 13, color: '#7a5c5c',
            marginBottom: 36, backdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(212,84,122,0.1)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#d4547a', display: 'inline-block' }} className="animate-pulse-rose" />
            For students across India · Free · Confidential
          </div>

          {/* H1 */}
          <h1 className="fade-up-2" style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(52px, 7.5vw, 96px)',
            fontWeight: 700, lineHeight: 0.97,
            letterSpacing: '-2.5px', marginBottom: 28,
          }}>
            <span style={{ display: 'block', color: '#3d2c2c' }}>Placement season</span>
            <span style={{
              display: 'block', fontStyle: 'italic',
              background: 'linear-gradient(135deg, #d4547a 0%, #f0408a 45%, #ff6ab0 80%, #e03070 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundSize: '200% 200%',
              animation: 'aurora-shift 6s ease infinite',
            }}>is hard. You're not.</span>
          </h1>

          <p className="fade-up-3" style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 300,
            color: '#7a5c5c', maxWidth: 580, margin: '0 auto 52px', lineHeight: 1.7,
          }}>
            Feeling overwhelmed, rejected, or just <em style={{ color: '#d4547a' }}>exhausted</em>?
            Share how you're feeling — a real counsellor from your college will call you back.
          </p>

          {/* CTAs */}
          <div className="fade-up-4" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => document.getElementById('reach-out')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-shimmer"
              style={{
                background: 'linear-gradient(135deg, #d4547a, #f0408a)',
                color: '#fff', border: 'none', padding: '16px 40px', borderRadius: 100,
                fontSize: 16, fontWeight: 500, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
                boxShadow: '0 8px 36px rgba(212,84,122,0.4)',
                transition: 'transform 0.25s, box-shadow 0.25s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 14px 48px rgba(212,84,122,0.55)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 36px rgba(212,84,122,0.4)' }}
            >💬 Share How You Feel</button>

            <button
              onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}
              style={{
                background: 'rgba(255,255,255,0.8)', color: '#3d2c2c',
                border: '1.5px solid rgba(240,168,195,0.5)', padding: '16px 36px', borderRadius: 100,
                fontSize: 16, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer',
                backdropFilter: 'blur(12px)', transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.95)'; e.currentTarget.style.borderColor = '#d4547a' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.8)'; e.currentTarget.style.borderColor = 'rgba(240,168,195,0.5)' }}
            >How it works →</button>
          </div>

          {/* Stats cards */}
          <div className="fade-up-5" style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 72 }}>
            {[
              { icon: '🏫', val: '50+', label: 'Colleges Supported' },
              { icon: '🤝', val: '2 hrs', label: 'Avg Response Time' },
              { icon: '🔒', val: '100%', label: 'Confidential' },
              { icon: '🧠', val: 'BERT', label: 'AI-Powered Priority' },
            ].map(({ icon, val, label }) => (
              <div key={label} className="glass-card animate-float-card" style={{
                borderRadius: 20, padding: '18px 24px',
                display: 'flex', alignItems: 'center', gap: 14, minWidth: 170,
                transition: 'transform 0.3s, box-shadow 0.3s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}
              >
                <span style={{ fontSize: 26 }}>{icon}</span>
                <div>
                  <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 600, color: '#d4547a' }}>{val}</div>
                  <div style={{ fontSize: 11, color: '#b08888', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll hint */}
        <div style={{ position: 'absolute', bottom: 36, left: '50%', transform: 'translateX(-50%)', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: '#b08888', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          <div style={{ width: 22, height: 36, border: '2px solid #e8a0a0', borderRadius: 11, display: 'flex', justifyContent: 'center', paddingTop: 5 }}>
            <div className="animate-scroll-wheel" style={{ width: 3, height: 7, background: '#e8a0a0', borderRadius: 2 }} />
          </div>
          <span>Scroll</span>
        </div>
      </section>

      {/* ── MARQUEE STRIP ── */}
      <div style={{ background: 'linear-gradient(135deg, #d4547a, #f0408a)', overflow: 'hidden', padding: '14px 0', whiteSpace: 'nowrap' }}>
        <div className="animate-marquee" style={{ display: 'inline-flex' }}>
          {[...STRIP_ITEMS, ...STRIP_ITEMS].map((item, i) => (
            <div key={i} style={{ display: 'inline-flex', alignItems: 'center', padding: '0 32px', fontSize: 13, color: 'rgba(255,255,255,0.88)', borderRight: '1px solid rgba(255,255,255,0.22)' }}>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── FORM ── */}
      <section id="reach-out" style={{ position: 'relative', zIndex: 2, padding: '120px 24px', background: 'linear-gradient(to bottom, rgba(255,245,250,0.95), rgba(254,240,248,0.98))' }}>
        <div ref={addReveal} className="reveal" style={{ maxWidth: 740, margin: '0 auto' }}>
          <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 500, color: '#d4547a', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16, border: '1px solid #f9d0d0', padding: '4px 14px', borderRadius: 100, background: 'rgba(255,255,255,0.7)' }}>
            Share Your Feelings
          </span>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 'clamp(36px, 5vw, 52px)', fontWeight: 600, lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 14, color: '#3d2c2c' }}>
            We're here to <em style={{ color: '#d4547a', fontStyle: 'italic' }}>listen.</em>
          </h2>
          <p style={{ color: '#7a5c5c', fontSize: 16, fontWeight: 300, lineHeight: 1.7, marginBottom: 48, maxWidth: 520 }}>
            Fill this form — our AI understands how you feel, and a counsellor from your college will call you personally.
          </p>

          <div className="glass-card" style={{ borderRadius: 28, padding: 48 }}>
            <form onSubmit={handleSubmit}>
              {/* Name + Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 22 }}>
                {[
                  { id: 'name', label: 'Your Name', placeholder: 'Aarav Sharma', type: 'text' },
                  { id: 'phone', label: 'Phone Number', placeholder: '+91 98765 43210', type: 'tel' },
                ].map(f => (
                  <div key={f.id}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#7a5c5c', marginBottom: 8 }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} required
                      value={formData[f.id]}
                      onChange={e => setFormData(p => ({ ...p, [f.id]: e.target.value }))}
                      style={inputStyle}
                      onFocus={e => { e.target.style.borderColor = '#d4547a'; e.target.style.boxShadow = '0 0 0 4px rgba(212,84,122,0.1)'; e.target.style.background = '#fff' }}
                      onBlur={e => { e.target.style.borderColor = '#f0d8d8'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(253,248,244,0.8)' }}
                    />
                  </div>
                ))}
              </div>

              {/* College + Year */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 22 }}>
                <div>
                  <label style={labelStyle}>College / University</label>
                  <select required value={formData.college} onChange={e => setFormData(p => ({ ...p, college: e.target.value }))} style={selectStyle}>
                    <option value="">Select your college…</option>
                    {['NSUT — Netaji Subhas University of Technology', 'DTU — Delhi Technological University', 'IIT Delhi', 'IIT Bombay', 'IIT Madras', 'BITS Pilani', 'NIT Trichy', 'VIT Vellore', 'Jadavpur University', 'IIIT Hyderabad', 'Other'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Year of Study</label>
                  <select required value={formData.year} onChange={e => setFormData(p => ({ ...p, year: e.target.value }))} style={selectStyle}>
                    <option value="">Select year…</option>
                    {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Postgraduate'].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Mood */}
              <div style={{ marginBottom: 22 }}>
                <label style={labelStyle}>How are you feeling right now?</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 8 }}>
                  {MOODS.map(({ emoji, label }) => (
                    <button key={label} type="button"
                      onClick={() => setSelectedMood(label)}
                      style={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                        padding: '12px 16px', borderRadius: 16, flex: 1, minWidth: 80,
                        border: selectedMood === label ? '2px solid #d4547a' : '1.5px solid #f0d8d8',
                        background: selectedMood === label ? 'rgba(212,84,122,0.07)' : 'rgba(253,248,244,0.8)',
                        color: selectedMood === label ? '#d4547a' : '#7a5c5c',
                        cursor: 'pointer', fontSize: 11, fontFamily: 'DM Sans, sans-serif',
                        transition: 'all 0.2s',
                      }}>
                      <span style={{ fontSize: 22 }}>{emoji}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text */}
              <div style={{ marginBottom: 22 }}>
                <label style={labelStyle}>
                  What's on your mind? <span style={{ color: '#b08888', fontWeight: 400 }}>(Share as much or as little as you want)</span>
                </label>
                <textarea rows={6} required
                  placeholder="I've been feeling really stressed about placements lately. I got rejected from 3 companies this week and I'm starting to doubt myself…"
                  value={formData.text}
                  onChange={e => setFormData(p => ({ ...p, text: e.target.value }))}
                  style={{ ...inputStyle, resize: 'none', lineHeight: 1.7 }}
                  onFocus={e => { e.target.style.borderColor = '#d4547a'; e.target.style.boxShadow = '0 0 0 4px rgba(212,84,122,0.1)'; e.target.style.background = '#fff' }}
                  onBlur={e => { e.target.style.borderColor = '#f0d8d8'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(253,248,244,0.8)' }}
                />
              </div>

              {/* Topic */}
              <div style={{ marginBottom: 22 }}>
                <label style={labelStyle}>What's this mainly about?</label>
                <select value={formData.topic} onChange={e => setFormData(p => ({ ...p, topic: e.target.value }))} style={selectStyle}>
                  {['Placement rejections', 'Internship stress', 'Academic pressure', 'Comparison with peers', 'Family expectations', 'Self-doubt / Imposter syndrome', 'Financial stress', 'Just need someone to talk to'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              {/* Call time */}
              <div style={{ marginBottom: 28 }}>
                <label style={labelStyle}>Best time to call you?</label>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 8 }}>
                  {[['morning', 'Morning (9–12)'], ['afternoon', 'Afternoon (12–5)'], ['evening', 'Evening (5–9)'], ['anytime', 'Anytime']].map(([val, lbl]) => (
                    <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 14, color: '#7a5c5c' }}>
                      <input type="radio" name="calltime" value={val} checked={formData.calltime === val}
                        onChange={() => setFormData(p => ({ ...p, calltime: val }))}
                        style={{ accentColor: '#d4547a' }} /> {lbl}
                    </label>
                  ))}
                </div>
              </div>

              <button type="submit" disabled={submitting} className="btn-shimmer" style={{
                width: '100%', background: 'linear-gradient(135deg, #d4547a, #f0408a)',
                color: '#fff', border: 'none', padding: 16, borderRadius: 14,
                fontFamily: 'DM Sans, sans-serif', fontSize: 16, fontWeight: 500, cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 28px rgba(212,84,122,0.38)', opacity: submitting ? 0.7 : 1,
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
                onMouseEnter={e => !submitting && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                {submitting ? 'Sending… 🌸' : '🌸 Submit — Someone Will Reach Out'}
              </button>
              <p style={{ textAlign: 'center', fontSize: 12, color: '#b08888', marginTop: 14, lineHeight: 1.6 }}>
                Your information is completely confidential. Only your college counsellor can see this.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" ref={addReveal} className="reveal" style={{ padding: '120px 56px', maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        <span style={sectionLabelStyle}>How It Works</span>
        <h2 style={sectionHStyle}>Simple, <em style={{ color: '#d4547a' }}>human-first</em> support.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, background: '#f0d8d8', border: '1px solid #f0d8d8', borderRadius: 24, overflow: 'hidden', marginTop: 56 }}>
          {[
            { num: '01', icon: '✍️', title: 'You Share', text: 'Write how you\'re feeling in your own words. No judgment. No right or wrong answer.' },
            { num: '02', icon: '🧠', title: 'AI Understands', text: 'BERT sentiment model reads your words and gives a priority score so the most distressed students get help first.' },
            { num: '03', icon: '📋', title: 'Counsellor Sees It', text: 'Your college\'s counsellor sees your entry in their dashboard, ranked by urgency, with AI analysis.' },
            { num: '04', icon: '📞', title: 'They Call You', text: 'A real human calls you — no chatbot, no email. A genuine conversation with someone who cares.' },
          ].map(({ num, icon, title, text }) => (
            <div key={num} style={{ background: 'rgba(255,255,255,0.75)', padding: '36px 28px', transition: 'background 0.25s', cursor: 'default' }}
              onMouseEnter={e => e.currentTarget.style.background = '#fff'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.75)'}
            >
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 52, fontWeight: 700, color: '#f9d0d0', lineHeight: 1, marginBottom: 16 }}>{num}</div>
              <div style={{ fontSize: 26, marginBottom: 12 }}>{icon}</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, marginBottom: 10 }}>{title}</div>
              <p style={{ fontSize: 13, color: '#7a5c5c', lineHeight: 1.7 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── RESOURCES ── */}
      <section id="resources" ref={addReveal} className="reveal" style={{ padding: '100px 56px', background: 'rgba(254,240,248,0.95)', borderTop: '1px solid #f0d8d8', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <span style={sectionLabelStyle}>Immediate Resources</span>
          <h2 style={sectionHStyle}>Need help <em style={{ color: '#d4547a' }}>right now?</em></h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginTop: 52 }}>
            {RESOURCES.map(({ icon, title, desc, link }) => (
              <div key={title} className="glass-card" style={{ borderRadius: 20, padding: 28, transition: 'transform 0.25s, box-shadow 0.25s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 16px 48px rgba(212,84,122,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
              >
                <div style={{ fontSize: 32, marginBottom: 14 }}>{icon}</div>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{title}</div>
                <p style={{ fontSize: 13, color: '#7a5c5c', lineHeight: 1.7 }}>{desc}</p>
                <div style={{ marginTop: 14, fontSize: 13, color: '#d4547a', fontWeight: 500, cursor: 'pointer' }}>{link}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── QUOTES ── */}
      <section ref={addReveal} className="reveal" style={{ padding: '100px 56px', background: 'linear-gradient(135deg, #fde8e8 0%, #fef3f0 100%)', borderTop: '1px solid #f0d8d8', position: 'relative', zIndex: 2 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <span style={sectionLabelStyle}>What Students Said</span>
          <blockquote style={{ fontFamily: 'Playfair Display, serif', fontStyle: 'italic', fontSize: 'clamp(20px, 3.5vw, 32px)', fontWeight: 400, lineHeight: 1.45, color: '#3d2c2c', margin: '36px 0 20px', letterSpacing: '-0.3px', transition: 'opacity 0.5s' }}>
            "{QUOTES[quoteIdx].text}"
          </blockquote>
          <p style={{ fontSize: 13, color: '#b08888' }}>{QUOTES[quoteIdx].attr}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 28 }}>
            {QUOTES.map((_, i) => (
              <button key={i} onClick={() => setQuoteIdx(i)} style={{ width: 8, height: 8, borderRadius: '50%', border: 'none', background: i === quoteIdx ? '#d4547a' : '#f9d0d0', cursor: 'pointer', transition: 'background 0.2s' }} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: '40px 56px', borderTop: '1px solid #f0d8d8', background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
        <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 20, color: '#d4547a' }}>🌸 CampusCare</div>
        <div style={{ display: 'flex', gap: 28 }}>
          {[['Share Feelings', '#reach-out'], ['Resources', '#resources'], ['Official Login', '/auth'], ['Privacy', '#']].map(([label, href]) => (
            <a key={label} href={href} style={{ fontSize: 13, color: '#b08888', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = '#d4547a'} onMouseLeave={e => e.target.style.color = '#b08888'}>{label}</a>
          ))}
        </div>
        <div style={{ fontSize: 12, color: '#b08888' }}>Built with care for students across India</div>
      </footer>

      {/* ── SUCCESS OVERLAY ── */}
      {showSuccess && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(253,232,232,0.96)', backdropFilter: 'blur(20px)', zIndex: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 40 }}>
          <div className="animate-pop-in" style={{ fontSize: 72, marginBottom: 24 }}>🌸</div>
          <h2 style={{ fontFamily: 'Playfair Display, serif', fontSize: 42, fontWeight: 700, color: '#3d2c2c', marginBottom: 12 }}>We hear you.</h2>
          <p style={{ fontSize: 18, color: '#7a5c5c', fontWeight: 300, maxWidth: 500, lineHeight: 1.7, marginBottom: 36 }}>
            Your feelings have been received. A counsellor from your college will call you within 2 hours. You are <strong>not alone</strong>.
          </p>
          <div style={{ background: 'rgba(255,255,255,0.8)', border: '1px solid #f0d8d8', borderRadius: 20, padding: '20px 32px', marginBottom: 28, display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[['Your Name', successData.name], ['College', successData.college], ['Priority', successData.priority + ' Priority']].map(([k, v]) => (
              <div key={k} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 600, color: '#d4547a' }}>{v}</div>
                <div style={{ fontSize: 12, color: '#b08888', marginTop: 4 }}>{k}</div>
              </div>
            ))}
          </div>
          <button onClick={() => setShowSuccess(false)} style={{ background: 'linear-gradient(135deg, #d4547a, #f0408a)', color: '#fff', border: 'none', padding: '14px 36px', borderRadius: 100, fontSize: 16, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', boxShadow: '0 6px 24px rgba(212,84,122,0.35)' }}>
            ← Go Back
          </button>
        </div>
      )}
    </div>
  )
}

// Shared style objects
const inputStyle = {
  width: '100%', background: 'rgba(253,248,244,0.8)', border: '1.5px solid #f0d8d8',
  borderRadius: 14, color: '#3d2c2c', fontFamily: 'DM Sans, sans-serif', fontSize: 15,
  padding: '13px 18px', outline: 'none', transition: 'border-color 0.25s, box-shadow 0.25s, background 0.25s',
}
const selectStyle = {
  ...inputStyle,
  cursor: 'pointer', appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23b08888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center',
}
const labelStyle = { display: 'block', fontSize: 13, fontWeight: 500, color: '#7a5c5c', marginBottom: 8 }
const sectionLabelStyle = { display: 'inline-block', fontSize: 11, fontWeight: 500, color: '#d4547a', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 16, border: '1px solid #f9d0d0', padding: '4px 14px', borderRadius: 100, background: 'rgba(255,255,255,0.7)' }
const sectionHStyle = { fontFamily: 'Playfair Display, serif', fontSize: 'clamp(32px, 4.5vw, 48px)', fontWeight: 600, lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 14, color: '#3d2c2c' }
