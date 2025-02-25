import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:5001";

export default function VideoCall({ roomId, isCaller }) {
  const [callStarted, setCallStarted] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const recognitionRef = useRef(null);
  const socketRef = useRef(null);
  const pendingICECandidates = useRef([]);

  useEffect(() => {
    const socketInstance = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
    socketRef.current = socketInstance;

    socketInstance.emit("join-room", roomId);

    socketInstance.on("receive-offer", async (offer) => {
      console.log("📩 Received offer");

      if (!peerConnection.current) {
        await setupPeerConnection(false); // Callee sets up connection
      }

      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      console.log("✅ Remote description set (offer)");

      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socketRef.current.emit("send-answer", { roomId, answer });
      console.log("📤 Sent answer");

      processPendingCandidates();
    });

    socketInstance.on("receive-answer", async (answer) => {
      console.log("📩 Received answer");

      if (peerConnection.current && !peerConnection.current.currentRemoteDescription) {
        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("✅ Remote description set (answer)");
        processPendingCandidates();
      }
    });

    socketInstance.on("receive-ice-candidate", async (candidate) => {
      if (peerConnection.current) {
        if (peerConnection.current.remoteDescription) {
          await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("🧊 ICE candidate added");
        } else {
          console.log("⏳ Queued ICE candidate (remote description not set)");
          pendingICECandidates.current.push(candidate);
        }
      }
    });

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      socketInstance.disconnect();
      peerConnection.current?.close();
    };
  }, [roomId]);

  const processPendingCandidates = () => {
    pendingICECandidates.current.forEach(async (candidate) => {
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      console.log("🧊 Processed queued ICE candidate");
    });
    pendingICECandidates.current = [];
  };

  const setupPeerConnection = async (initiator = true) => {
    setCallStarted(true);

    const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = localStream;

    peerConnection.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Add local tracks
    localStream.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStream);
    });

    // Handle remote tracks
    const remoteStream = new MediaStream();
    peerConnection.current.ontrack = ({ track }) => {
      remoteStream.addTrack(track);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        console.log("📺 Remote video stream set");
      }
    };

    // Handle ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit("send-ice-candidate", { roomId, candidate: event.candidate });
        console.log("📤 Sent ICE candidate");
      }
    };

    // Start speech recognition for patient
    if (!initiator && "webkitSpeechRecognition" in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");

        if (socketRef.current && transcript) {
          console.log("🗣️ Transcription emitted:", transcript);
          socketRef.current.emit("transcription-result", { roomId, transcript });
        }
      };

      recognition.start();
    }

    // Doctor initiates the call with an offer
    if (initiator) {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socketRef.current.emit("send-offer", { roomId, offer });
      console.log("📤 Sent offer");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="w-1/2">
          <p className="text-center font-semibold">Your Video</p>
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full border rounded" />
        </div>
        <div className="w-1/2">
          <p className="text-center font-semibold">Remote Video</p>
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full border rounded" />
        </div>
      </div>
      {isCaller && !callStarted && (
        <button onClick={() => setupPeerConnection(true)} className="w-full p-2 bg-green-500 text-white rounded">
          Start Call
        </button>
      )}
    </div>
  );
}