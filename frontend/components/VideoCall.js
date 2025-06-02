import { useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'

export default function VideoCall({ role }) {
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const peerConnectionRef = useRef(null)
  const [liveText, setLiveText] = useState('')
  const [symptoms, setSymptoms] = useState([])
  const transcriptRef = useRef('') // full transcript (patient only)

  useEffect(() => {
    const socket = io('http://localhost:5050')
    socket.emit('join')

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      const pc = new RTCPeerConnection()
      peerConnectionRef.current = pc
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream
      }

      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      pc.ontrack = (event) => {
        remoteVideoRef.current.srcObject = event.streams[0]
      }

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socket.emit('ice-candidate', e.candidate)
        }
      }

      socket.on('offer', async offer => {
        await pc.setRemoteDescription(offer)
        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        socket.emit('answer', answer)
      })

      socket.on('answer', async answer => {
        await pc.setRemoteDescription(answer)
      })

      socket.on('ice-candidate', async candidate => {
        try {
          await pc.addIceCandidate(candidate)
        } catch (err) {
          console.error('Error adding ICE candidate', err)
        }
      })

      socket.on('transcription', text => {
        console.log('Received transcription:', text)
        setLiveText(prev => prev + ' ' + text) // append new part only

        if (role === 'doctor') {
          fetch('http://localhost:5001/extract', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }), // send just the new part
          })
            .then(res => res.json())
            .then(data => {
              if (Array.isArray(data.symptoms)) {
                setSymptoms(prev => {
                  const merged = new Set([...prev, ...data.symptoms])
                  return Array.from(merged)
                })
              }
            })
            .catch(err => console.error('Symptom extraction failed', err))
        }
      })

      if (role === 'patient') {
        pc.createOffer().then(offer => {
          pc.setLocalDescription(offer)
          socket.emit('offer', offer)
        })

        if ('webkitSpeechRecognition' in window) {
          const recognition = new webkitSpeechRecognition()
          recognition.continuous = true
          recognition.interimResults = true
          recognition.lang = 'en-US'

          recognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              const result = event.results[i]
              if (result.isFinal) {
                const finalText = result[0].transcript.trim()
                if (finalText) {
                  transcriptRef.current += ' ' + finalText
                  socket.emit('transcription', finalText) // emit just the new part
                }
              }
            }
          }

          recognition.onerror = (e) => console.error('Speech recognition error', e)
          recognition.start()
        }
      }
    })

    return () => {
      socket.disconnect()
    }
  }, [role])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row gap-4">
        <video ref={localVideoRef} autoPlay muted className="w-full md:w-1/2 border" />
        <video ref={remoteVideoRef} autoPlay className="w-full md:w-1/2 border" />
      </div>

      {role === 'doctor' && (
        <div className="p-4 border rounded bg-white">
          <h2 className="text-lg font-semibold mb-2">Live Transcription</h2>
          <p className="text-gray-800 whitespace-pre-line mb-4">{liveText}</p>

          {symptoms.length > 0 && (
            <>
              <h3 className="text-md font-semibold mb-1">Extracted Symptoms</h3>
              <ul className="list-disc ml-6 text-gray-800">
                {symptoms.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}