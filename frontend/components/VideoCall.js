// components/VideoCall.js
import { useEffect, useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";

export default function VideoCall({ roomId, isCaller }) {
  const [callStarted, setCallStarted] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnection = useRef(null);
  const socket = useSocket();
  const pendingICECandidates = useRef([]);
  const recognitionRef = useRef(null); // For speech recognition


  useEffect(() => {
    if (!socket) return;
  
    socket.on("end-call", () => {
      console.log("☎️ Call ended by other party");
      peerConnection.current?.close();
      setCallStarted(false);
    });
  
    return () => {
      socket.off("end-call");
    };
  }, [socket]);

  
  useEffect(() => {
    if (!socket) return;

    const joinRoom = () => {
      if (socket.connected) {
        socket.emit("join-room", roomId);
      } else {
        socket.once("connect", () => socket.emit("join-room", roomId));
      }
    };

    joinRoom();

    socket.on("receive-offer", async (offer) => {
      if (!peerConnection.current) await setupPeerConnection(false);
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socket.emit("send-answer", { roomId, answer });
      processPendingCandidates();
    });

    socket.on("receive-answer", async (answer) => {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
      processPendingCandidates();
    });

    socket.on("receive-ice-candidate", async (candidate) => {
      if (peerConnection.current && peerConnection.current.remoteDescription) {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } else {
        pendingICECandidates.current.push(candidate);
      }
    });

    return () => {
      peerConnection.current?.close();
      socket.off("receive-offer");
      socket.off("receive-answer");
      socket.off("receive-ice-candidate");
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [socket, roomId]);

  const processPendingCandidates = () => {
    pendingICECandidates.current.forEach(async (candidate) => {
      await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
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

    localStream.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, localStream);
    });

    const remoteStream = new MediaStream();
    peerConnection.current.ontrack = ({ track }) => {
      remoteStream.addTrack(track);
      remoteVideoRef.current.srcObject = remoteStream;
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("send-ice-candidate", { roomId, candidate: event.candidate });
      }
    };

    if (!initiator && "webkitSpeechRecognition" in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognitionRef.current = recognition;

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results).map((r) => r[0].transcript).join("");
        if (transcript.trim()) {
          socket.emit("transcription-result", { roomId, transcript });
        }
      };

      recognition.start();
    }

    if (initiator) {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      socket.emit("send-offer", { roomId, offer });
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
        <button
          onClick={() => setupPeerConnection(true)}
          className="w-full p-2 bg-green-500 text-white rounded"
        >
          Start Call
        </button>
      )}
    </div>
  );
}