// // pages/doctor-dashboard.js
// import { useState } from "react";
// import ProtectedRoute from "../components/ProtectedRoute";
// import VideoCall from "../components/VideoCall";
// import { useSocket } from "../context/SocketContext";

// export default function DoctorDashboard() {
//   const [patientEmail, setPatientEmail] = useState("");
//   const [roomId, setRoomId] = useState("");
//   const [callStarted, setCallStarted] = useState(false);
//   const socket = useSocket();

//   const handleStartCall = () => {
//     if (!socket) {
//       console.error("Socket not initialized.");
//       alert("Connection not established. Please wait.");
//       return;
//     }
  
//     if (!patientEmail) {
//       alert("Please enter a patient email.");
//       return;
//     }
  
//     const generatedRoomId = `call-${patientEmail.replace(/[@.]/g, "")}`;
//     setRoomId(generatedRoomId);
//     setCallStarted(true);
  
//     if (socket.connected) {
//       socket.emit("call-patient", { roomId: generatedRoomId, patientEmail });
//     } else {
//       socket.once("connect", () => {
//         socket.emit("call-patient", { roomId: generatedRoomId, patientEmail });
//       });
//     }
//   };

//   return (
//     <ProtectedRoute allowedRoles={["doctor"]}>
//       <div className="p-6 space-y-4">
//         <h1 className="text-3xl font-bold">Doctor Dashboard</h1>

//         {!callStarted ? (
//           <>
//             <input
//               type="email"
//               value={patientEmail}
//               onChange={(e) => setPatientEmail(e.target.value)}
//               placeholder="Enter patient email"
//               className="w-full p-2 border rounded"
//             />
//             <button
//               onClick={handleStartCall}
//               className="w-full p-2 bg-green-500 text-white rounded"
//             >
//               Start Call
//             </button>
//           </>
//         ) : (
//           <VideoCall roomId={roomId} isCaller={true} />
//         )}
//       </div>
//     </ProtectedRoute>
//   );
// }



// pages/doctor-dashboard.js
import { useState, useEffect } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import VideoCall from "../components/VideoCall";
import { useSocket } from "../context/SocketContext";
import axios from "axios";

const SYMPTOM_API_URL = "http://127.0.0.1:5002/extract-symptoms";

export default function DoctorDashboard() {
  const [patientEmail, setPatientEmail] = useState("");
  const [roomId, setRoomId] = useState("");
  const [callStarted, setCallStarted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    socket.on("transcription-result", ({ transcript }) => {
      setTranscript(transcript);
      extractSymptoms(transcript); // Call symptom extraction
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

    if (socket.connected) {
      socket.emit("call-patient", { roomId: generatedRoomId, patientEmail });
    } else {
      socket.once("connect", () => {
        socket.emit("call-patient", { roomId: generatedRoomId, patientEmail });
      });
    }
  };

  return (
    <ProtectedRoute allowedRoles={["doctor"]}>
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold">Doctor Dashboard</h1>

        {!callStarted ? (
          <>
            <input
              type="email"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              placeholder="Enter patient email"
              className="w-full p-2 border rounded"
            />
            <button
              onClick={handleStartCall}
              className="w-full p-2 bg-green-500 text-white rounded"
            >
              Start Call
            </button>
          </>
        ) : (
          <VideoCall roomId={roomId} isCaller={true} />
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