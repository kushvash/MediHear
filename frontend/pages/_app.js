import { useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../lib/firebase'
import io from 'socket.io-client'
// import '../styles/globals.css'

const socket = io('http://localhost:5050')

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetch(`http://localhost:5050/api/users/${user.uid}`)
          .then(res => res.json())
          .then(data => {
            const role = data.role
            socket.emit('register', {
              uid: user.uid,
              role,
              email: user.email, // Include email here
            }, 500)
          })
      }
    })

    return () => unsubscribe()
  }, [])

  return <Component {...pageProps} />
}

export default MyApp