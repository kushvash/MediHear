// pages/patient-dashboard.js
import ProtectedRoute from "../components/ProtectedRoute";
import VideoCall from "../components/VideoCall";

export default function PatientDashboard() {
  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold">Patient Dashboard</h1>
        <VideoCall roomId="medihear-room" isCaller={false} />
      </div>
    </ProtectedRoute>
  );
}