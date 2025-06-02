// 'use client'

// import React from 'react'
// import VideoCall from '../components/VideoCall'
// import ProtectedRoute from '../components/ProtectedRoute'
// import { auth } from '../lib/firebase'
// import { useRouter } from 'next/router'

// export default function DoctorDashboard() {
//   const router = useRouter()
//   const handleLogout = () => {
//     auth.signOut().then(() => router.replace('/login'))
//   }
//   return (
//     <ProtectedRoute allowedRole="doctor">
//       <div className="p-4">
//         <h1 className="text-xl font-bold">Doctor Dashboard</h1>
//         <button
//           onClick={handleLogout}
//           className="mt-4 mb-2 px-4 py-2 bg-red-600 text-white rounded float-right"
//         >
//           Logout
//         </button>
//         <VideoCall role="doctor" />
//       </div>
//     </ProtectedRoute>
//   )
// }


'use client'

import React, { useEffect, useState, useRef } from 'react'
import VideoCall from '../components/VideoCall'
import ProtectedRoute from '../components/ProtectedRoute'
import { auth } from '../lib/firebase'
import { useRouter } from 'next/router'
import io from 'socket.io-client'

const socket = io('http://localhost:5050')

export default function DoctorDashboard() {
  const router = useRouter()
  const [patients, setPatients] = useState([])
  const [inCall, setInCall] = useState(false)
  const peerConnectionRef = useRef(null)

  const handleLogout = () => {
    auth.signOut().then(() => router.replace('/login'))
  }

  useEffect(() => {
    fetch('http://localhost:5050/api/online/patients')
      .then(res => res.json())
      .then(data => {
        setPatients(data.patients || [])
      })
      .catch(() => {
        setPatients([])
      })
  }, [])

  const callPatient = async (patientSocketId) => {
    const pc = new RTCPeerConnection()
    peerConnectionRef.current = pc

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    stream.getTracks().forEach(track => pc.addTrack(track, stream))

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    socket.emit('call-patient', { patientSocketId, offer })
    setInCall(true)

    socket.on('call-answered', async ({ answer }) => {
      await pc.setRemoteDescription(answer)
    })

    socket.on('ice-candidate', async ({ candidate }) => {
      try {
        await pc.addIceCandidate(candidate)
      } catch (err) {
        console.error('Error adding ICE candidate', err)
      }
    })

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit('ice-candidate', {
          targetSocketId: patientSocketId,
          candidate: e.candidate,
        })
      }
    }
  }

  return (
    <ProtectedRoute allowedRole="doctor">
      <div className="p-4">
        <h1 className="text-xl font-bold">Doctor Dashboard</h1>
        <button
          onClick={handleLogout}
          className="mt-4 mb-2 px-4 py-2 bg-red-600 text-white rounded float-right"
        >
          Logout
        </button>

        {!inCall && (
          <div className="my-4">
            <h2 className="font-semibold mb-2">Online Patients</h2>
            {patients.length === 0 ? (
              <p>No patients online.</p>
            ) : (
              <ul className="space-y-2">
                {patients.map((patient) => (
                  <li key={patient.socketId} className="flex justify-between items-center border p-2">
                    <span>{patient.email}</span>
                    <button
                      onClick={() => callPatient(patient.socketId)}
                      className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                      Call
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {inCall && <VideoCall role="doctor" />}
      </div>
    </ProtectedRoute>
  )
}