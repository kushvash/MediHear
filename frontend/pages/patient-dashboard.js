// pages/patient-dashboard.js
import { useState, useEffect } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import VideoCall from "../components/VideoCall";
import { useSocket } from "../context/SocketContext";

export default function PatientDashboard() {
  const [incomingCall, setIncomingCall] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [callAccepted, setCallAccepted] = useState(false);
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return; // Wait for socket initialization
  
    const email = localStorage.getItem("userEmail");
    if (!email) {
      alert("No patient email found. Please log in again.");
      return;
    }
  
    if (socket.connected) {
      socket.emit("join-patient", email);
    } else {
      socket.once("connect", () => {
        socket.emit("join-patient", email);
      });
    }
  
    socket.on("incoming-call", ({ roomId }) => {
      setIncomingCall(true);
      setRoomId(roomId);
    });
  
    return () => {
      socket.off("incoming-call");
      socket.off("connect");
    };
  }, [socket]);

  const handleAccept = () => {
    socket?.emit("call-accepted", { roomId });
    setIncomingCall(false);
    setCallAccepted(true);
  };

  const handleReject = () => {
    socket?.emit("call-rejected", { roomId });
    setIncomingCall(false);
  };

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold">Patient Dashboard</h1>
        {incomingCall && !callAccepted && (
          <div className="p-4 border rounded-lg bg-yellow-100">
            <h2 className="text-xl font-semibold">Incoming Call</h2>
            <button onClick={handleAccept} className="p-2 bg-green-500 text-white rounded m-2">
              Accept
            </button>
            <button onClick={handleReject} className="p-2 bg-red-500 text-white rounded m-2">
              Reject
            </button>
          </div>
        )}
        {callAccepted && <VideoCall roomId={roomId} isCaller={false} />}
      </div>
    </ProtectedRoute>
  );
}