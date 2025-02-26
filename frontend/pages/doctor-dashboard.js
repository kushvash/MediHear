// import { useState, useEffect } from "react";
// import ProtectedRoute from "../components/ProtectedRoute";
// import VideoCall from "../components/VideoCall";
// import { io } from "socket.io-client";

// const SOCKET_SERVER_URL = "http://localhost:5001";

// export default function DoctorDashboard() {
//   const [transcript, setTranscript] = useState("");

//   useEffect(() => {
//     const socket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
//     socket.emit("join-room", "medihear-room");

//     socket.on("transcription-result", ({ transcript }) => {
//       console.log("📝 Received transcription:", transcript);  // Debug log
//       setTranscript(transcript);
//     });

//     return () => socket.disconnect();
//   }, []);

//   return (
//     <ProtectedRoute allowedRoles={["doctor"]}>
//       <div className="p-6 space-y-4">
//         <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
//         <VideoCall roomId="medihear-room" isCaller={true} />
//         <div className="p-4 border rounded-lg bg-gray-100">
//           <h2 className="text-xl font-semibold mb-2">Live Transcription:</h2>
//           <p className="text-lg">{transcript || "Waiting for patient to speak..."}</p>
//         </div>
//       </div>
//     </ProtectedRoute>
//   );
// }


import { useState, useEffect } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import VideoCall from "../components/VideoCall";
import { io } from "socket.io-client";
import axios from "axios";

const SOCKET_SERVER_URL = "http://localhost:5001";
const SYMPTOM_API_URL = "http://127.0.0.1:5002/extract-symptoms";

export default function DoctorDashboard() {
  const [transcript, setTranscript] = useState("");
  const [symptoms, setSymptoms] = useState([]);

  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, { transports: ["websocket"] });
    socket.emit("join-room", "medihear-room");

    socket.on("transcription-result", async ({ transcript }) => {
      setTranscript(transcript);
      await extractSymptoms(transcript);  // Extract symptoms on new transcript
    });

    return () => socket.disconnect();
  }, []);

  const extractSymptoms = async (transcript) => {
    try {
      const response = await axios.post(SYMPTOM_API_URL, { transcript });
      setSymptoms(response.data.symptoms);
    } catch (error) {
      console.error("Symptom extraction error:", error);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold">Doctor Dashboard</h1>
        <VideoCall roomId="medihear-room" isCaller={true} />

        <div className="p-4 border rounded-lg bg-gray-100">
          <h2 className="text-xl font-semibold mb-2">Live Transcription:</h2>
          <p className="text-lg">{transcript || "Waiting for patient to speak..."}</p>
        </div>

        <div className="p-4 border rounded-lg bg-green-100">
          <h2 className="text-xl font-semibold mb-2">Extracted Symptoms:</h2>
          {symptoms.length > 0 ? (
            <ul className="list-disc pl-6">
              {symptoms.map((symptom, index) => (
                <li key={index} className="text-lg capitalize">{symptom}</li>
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