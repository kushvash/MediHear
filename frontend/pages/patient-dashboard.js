// pages/patient-dashboard.js
import { useState, useEffect } from "react";
import ProtectedRoute from "../components/ProtectedRoute";
import VideoCall from "../components/VideoCall";
import { useSocket } from "../context/SocketContext";
import { useRouter } from "next/router";

export default function PatientDashboard() {
  const [incomingCall, setIncomingCall] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [callAccepted, setCallAccepted] = useState(false);
  const socket = useSocket();
  const router = useRouter();

  useEffect(() => {
    if (!socket) return;

    const email = localStorage.getItem("userEmail");
    if (!email) {
      alert("No patient email found. Please log in again.");
      return;
    }

    socket.emit("join-patient", email);

    socket.on("incoming-call", ({ roomId }) => {
      setIncomingCall(true);
      setRoomId(roomId);
    });

    socket.on("end-call", () => {
      setCallAccepted(false);
      setIncomingCall(false);
      setRoomId("");
    });

    return () => {
      socket.off("incoming-call");
      socket.off("end-call");
    };
  }, [socket]);

  const handleAccept = () => {
    socket.emit("call-accepted", { roomId });
    setIncomingCall(false);
    setCallAccepted(true);
  };

  const handleReject = () => {
    socket.emit("call-rejected", { roomId });
    setIncomingCall(false);
  };

  const handleEndCall = () => {
    socket.emit("end-call", { roomId });
    setCallAccepted(false);
    setRoomId("");
  };

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <div className="p-6 space-y-4">
        <div className="flex justify-between">
          <h1 className="text-3xl font-bold">Patient Dashboard</h1>
          <button onClick={handleLogout} className="p-2 bg-red-500 text-white rounded">Logout</button>
        </div>

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

        {callAccepted && (
          <>
            <VideoCall roomId={roomId} isCaller={false} />
            <button onClick={handleEndCall} className="w-full p-2 bg-red-600 text-white rounded">
              End Call
            </button>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}