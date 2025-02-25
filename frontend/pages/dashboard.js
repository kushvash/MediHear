import { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const storedRole = localStorage.getItem("role");
        setRole(storedRole);
      } else {
        window.location.href = "/login";
      }
    });
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = "/login";
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">Welcome, {role}</h1>
      <button
        onClick={handleLogout}
        className="p-2 bg-red-500 text-white rounded"
      >
        Logout
      </button>

      {role === "doctor" ? (
        <div className="mt-4 p-4 border rounded">
          <h2 className="text-xl font-semibold">Doctor Dashboard</h2>
          {/* Future: Video feed, speech-to-text, notes */}
        </div>
      ) : (
        <div className="mt-4 p-4 border rounded">
          <h2 className="text-xl font-semibold">Patient Dashboard</h2>
          {/* Future: Video feed, doctor details */}
        </div>
      )}
    </div>
  );
}