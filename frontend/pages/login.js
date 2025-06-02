import { useState } from 'react'
import { useRouter } from 'next/router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email and password are required.')
      return
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid

      const res = await fetch(`http://localhost:5050/api/users/${uid}`)
      if (!res.ok) throw new Error('Failed to fetch user role')

      const userData = await res.json()
      const role = userData.role

      if (role === 'doctor') {
        router.push('/doctor')
      } else if (role === 'patient') {
        router.push('/patient')
      } else {
        setError('Role not found. Contact support.')
      }
    } catch (err) {
      const code = err?.code || ''

      if (code === 'auth/user-not-found') {
        setError('User not found.')
      } else if (code === 'auth/wrong-password') {
        setError('Incorrect password.')
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email format.')
      } else if (code === 'auth/invalid-credential') {
        setError('Invalid credentials. Check email and password.')
      } else {
        setError('Login failed. Try again.')
      }
    }
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login</h1>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <input
          type="email"
          placeholder="Email"
          className="border p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white px-4 py-2">
          Login
        </button>
      </form>
    </div>
  )
}