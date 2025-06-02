import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function ProtectedRoute({ children, allowedRole }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetch(`http://localhost:5050/api/users/${user.uid}`)
          .then(res => res.json())
          .then(data => {
            if (data.role === allowedRole) {
              setAuthorized(true)
            } else {
              router.replace('/login')
            }
            setLoading(false)
          })
          .catch(() => {
            router.replace('/login')
            setLoading(false)
          })
        return
      } else {
        router.replace('/login')
        setLoading(false)
      }
    })

    return () => unsub()
  }, [router, allowedRole])

  if (loading) return <p className="p-4">Checking access...</p>

  return authorized ? children : null
}