'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({ children }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let unsubscribe

    const checkAuth = async () => {
      try {
        const { auth } = await import('@/lib/firebase')
        const { onAuthStateChanged } = await import('firebase/auth')

        unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!user) {
            router.push('/auth')
            return
          }

          try {
            const { db } = await import('@/lib/firebase')
            const { collection, query, where, getDocs } = await import('firebase/firestore')
            const q = query(
              collection(db, 'approvedOfficials'),
              where('email', '==', user.email)
            )
            const snapshot = await getDocs(q)

            if (snapshot.empty) {
              await auth.signOut()
              router.push('/auth')
              return
            }

            // ✅ Approved — show dashboard
            setChecking(false)

          } catch (err) {
            console.error('Firestore check failed:', err)
            // Don't redirect on Firestore error — just show dashboard
            setChecking(false)
          }
        })

      } catch (err) {
        console.error('Auth check failed:', err)
        router.push('/auth')
      }
    }

    checkAuth()

    // Cleanup listener on unmount
    return () => { if (unsubscribe) unsubscribe() }
  }, [])

  if (checking) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#fdf8f4',
        flexDirection: 'column', gap: 16,
      }}>
        <div style={{ fontSize: 48, animation: 'sway 2s ease-in-out infinite' }}>🌸</div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, color: '#b08888' }}>
          Verifying access…
        </div>
      </div>
    )
  }

  return <>{children}</>
}