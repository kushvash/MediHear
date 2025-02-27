// pages/doctor-dashboard.js
import { useState, useEffect } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import VideoCall from "../components/VideoCall";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { useRouter } from "next/router";

const SYMPTOM_API_URL = "http://127.0.0.1:5002/extract-symptoms";

export default function DoctorDashboard() {
  const [patientEmail, setPatientEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [callStarted, setCallStarted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  const socket = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (!socket) return;

    socket.on("transcription-result", ({ transcript }) => {
      setTranscript(transcript);
      extractSymptoms(transcript);
    });

    return () => {
      socket.off("transcription-result");
    };
  }, [socket]);

  const extractSymptoms = async (transcript) => {
    try {
      const response = await axios.post(SYMPTOM_API_URL, { transcript });
      setSymptoms(response.data.symptoms);
    } catch (error) {
      console.error("Symptom extraction error:", error);
    }
  };

  const handleStartCall = () => {
    if (!patientEmail) return alert("Please enter a patient email.");

    const generatedRoomId = `call-${patientEmail.replace(/[@.]/g, "")}`;
    setRoomId(generatedRoomId);
    setCallStarted(true);

    socket.emit("call-patient", { roomId: generatedRoomId, patientEmail });
  };

  const handleEndCall = () => {
    socket.emit("end-call", { roomId });
    setCallStarted(false);
    setRoomId("");
    setTranscript("");
    setSymptoms([]);
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      <div className="p-6 space-y-4">
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
          <button onClick={handleLogout} className="p-2 bg-red-500 text-white rounded">Logout</button>
        </div>

        {!callStarted ? (
          <>
            <input
              type="email"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              placeholder="Enter patient email"
              className="w-full p-2 border rounded"
            />
            <button onClick={handleStartCall} className="w-full p-2 bg-green-500 text-white rounded">
              Start Call
            </button>
          </>
        ) : (
          <>
            <VideoCall roomId={roomId} isCaller={true} />
            <button onClick={handleEndCall} className="w-full p-2 bg-red-600 text-white rounded">
              End Call
            </button>
          </>
        )}

        <div className="p-4 border rounded-lg bg-gray-100">
          <h2 className="text-xl font-semibold mb-2">Live Transcription:</h2>
          <p className="text-lg">{transcript || "Waiting for patient to speak..."}</p>
        </div>

        <div className="p-4 border rounded-lg bg-green-100">
          <h2 className="text-xl font-semibold mb-2">Extracted Symptoms:</h2>
          {symptoms.length > 0 ? (
            <ul className="list-disc pl-6">
              {symptoms.map((symptom, idx) => (
                <li key={idx} className="text-lg capitalize">{symptom}</li>
              ))}
            </ul>
          ) : (
            <p className="text-lg">No symptoms detected yet.</p>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}