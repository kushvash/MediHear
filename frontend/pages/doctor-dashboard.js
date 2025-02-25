import { useState, useEffect } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import VideoCall from "../components/VideoCall";
import { io } from "socket.io-client";

const SOCKET_SERVER_URL = "http://localhost:5001";

export default function DoctorDashboard() {
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
    socket.emit("join-room", "medihear-room");

    socket.on("transcription-result", ({ transcript }) => {
      console.log("📝 Received transcription:", transcript);  // Debug log
      setTranscript(transcript);
    });

    return () => socket.disconnect();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
        <VideoCall roomId="medihear-room" isCaller={true} />
        <div className="p-4 border rounded-lg bg-gray-100">
          <h2 className="text-xl font-semibold mb-2">Live Transcription:</h2>
          <p className="text-lg">{transcript || "Waiting for patient to speak..."}</p>
        </div>
      </div>
    </ProtectedRoute>
  );
}