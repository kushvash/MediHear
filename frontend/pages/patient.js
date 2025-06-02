'use client'

import { useEffect, useState, useRef } from 'react'
import ProtectedRoute from '../components/ProtectedRoute'
import { auth } from '../lib/firebase'
import { useRouter } from 'next/router'
import io from 'socket.io-client'

const socket = io('http://localhost:5050')

export default function PatientDashboard() {
  const router = useRouter()
  const [incomingCall, setIncomingCall] = useState(null)
  const peerConnectionRef = useRef(null)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)

  useEffect(() => {
    socket.on('incoming-call', async ({ from, offer }) => {
      setIncomingCall({ from, offer })
    })

    socket.on('call-answered', ({ answer }) => {
      peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer))
    })

    socket.on('ice-candidate', ({ candidate }) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
      }
    })

    return () => {
      socket.off('incoming-call')
      socket.off('call-answered')
      socket.off('ice-candidate')
    }
  }, [])

  const handleAcceptCall = async () => {
    const pc = new RTCPeerConnection()
    peerConnectionRef.current = pc

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    localVideoRef.current.srcObject = stream
    stream.getTracks().forEach(track => pc.addTrack(track, stream))

    pc.ontrack = event => {
      remoteVideoRef.current.srcObject = event.streams[0]
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice-candidate', {
          targetSocketId: incomingCall.from,
          candidate: e.candidate
        })
      }
    }

    await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    socket.emit('answer-call', {
      doctorSocketId: incomingCall.from,
      answer
    })

    setIncomingCall(null)
  }

  const handleLogout = () => {
    auth.signOut().then(() => router.replace('/login'))
  }

  return (
    <ProtectedRoute allowedRole="patient">
      <div className="p-4">
        <h1 className="text-xl font-bold">Patient Dashboard</h1>
        <button
          onClick={handleLogout}
          className="mt-4 mb-2 px-4 py-2 bg-red-600 text-white rounded float-right"
        >
          Logout
        </button>

        {incomingCall && (
          <div className="p-4 border my-4 bg-yellow-100">
            <p>Incoming call from a doctor</p>
            <button onClick={handleAcceptCall} className="bg-green-500 text-white px-4 py-2 mt-2">
              Accept
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-4 mt-4">
          <video ref={localVideoRef} autoPlay muted className="w-full md:w-1/2 border" />
          <video ref={remoteVideoRef} autoPlay className="w-full md:w-1/2 border" />
        </div>
      </div>
    </ProtectedRoute>
  )
}