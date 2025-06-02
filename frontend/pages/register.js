import React, { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { useRouter } from 'next/router'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('patient')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Email and password are required.')
      return
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const uid = userCredential.user.uid

      const res = await fetch('http://localhost:5050/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, email, role }),
      })

      if (!res.ok) throw new Error('Failed to register user in database')

      router.push(role === 'doctor' ? '/doctor' : '/patient')
    } catch (err) {
      console.error('Registration error:', err)
      const code = err?.code

      if (code === 'auth/email-already-in-use') {
        setError('Email is already registered.')
      } else if (code === 'auth/invalid-email') {
        setError('Invalid email format.')
      } else if (code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.')
      } else {
        setError('Registration failed. Try again.')
      }
    }
  }

  return (
    <form onSubmit={handleRegister} className="max-w-md mx-auto mt-10 space-y-4">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email"
        className="w-full p-2 border"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Password"
        className="w-full p-2 border"
      />
      <select
        value={role}
        onChange={e => setRole(e.target.value)}
        className="w-full p-2 border"
      >
        <option value="patient">Patient</option>
        <option value="doctor">Doctor</option>
      </select>
      {error && <p className="text-red-600">{error}</p>}
      <button type="submit" className="w-full p-2 bg-blue-600 text-white">
        Register
      </button>
    </form>
  )
}