'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import React from 'react'

export default function Dashboard() {
  const router = useRouter()

  useEffect(() => {
    const role = localStorage.getItem('role')
    if (role === 'doctor') {
      router.replace('/doctor')
    } else if (role === 'patient') {
      router.replace('/patient')
    } else {
      router.replace('/login') // fallback
    }
  }, [])

  return null // or loading spinner
}