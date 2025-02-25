// import { useState } from "react";
// import { auth } from "../firebaseConfig";
// import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";

// export default function AuthForm({ isLogin }) {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [role, setRole] = useState("patient");

//   // components/AuthForm.js (Update handleSubmit)
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       if (isLogin) {
//         await signInWithEmailAndPassword(auth, email, password);
//         const role = localStorage.getItem("role");
//         window.location.href = role === "doctor" ? "/doctor-dashboard" : "/patient-dashboard";
//       } else {
//         await createUserWithEmailAndPassword(auth, email, password);
//         localStorage.setItem("role", role);
//         window.location.href = role === "doctor" ? "/doctor-dashboard" : "/patient-dashboard";
//       }
//     } catch (error) {
//       alert(error.message);
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 border rounded-lg">
//       <h2 className="text-2xl font-bold">{isLogin ? "Login" : "Register"}</h2>
//       <input
//         type="email"
//         placeholder="Email"
//         value={email}
//         onChange={(e) => setEmail(e.target.value)}
//         required
//         className="w-full p-2 border rounded"
//       />
//       <input
//         type="password"
//         placeholder="Password"
//         value={password}
//         onChange={(e) => setPassword(e.target.value)}
//         required
//         className="w-full p-2 border rounded"
//       />
//       {!isLogin && (
//         <select
//           value={role}
//           onChange={(e) => setRole(e.target.value)}
//           className="w-full p-2 border rounded"
//         >
//           <option value="patient">Patient</option>
//           <option value="doctor">Doctor</option>
//         </select>
//       )}
//       <button className="w-full p-2 bg-blue-500 text-white rounded">
//         {isLogin ? "Login" : "Register"}
//       </button>
//     </form>
//   );
// }


import { useState } from "react";
import { auth, db } from "../firebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function AuthForm({ isLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("patient");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isLogin) {
        // LOGIN FLOW
        const { user } = await signInWithEmailAndPassword(auth, email, password);
        const userRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const { role } = userDoc.data();
          localStorage.setItem("role", role); // Save role locally
          window.location.href = role === "doctor" ? "/doctor-dashboard" : "/patient-dashboard";
        } else {
          alert("No role found. Please contact support.");
        }

      } else {
        // REGISTRATION FLOW
        const { user } = await createUserWithEmailAndPassword(auth, email, password);
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { role });
        localStorage.setItem("role", role); // Save role locally
        window.location.href = role === "doctor" ? "/doctor-dashboard" : "/patient-dashboard";
      }

    } catch (error) {
      console.error("Auth Error:", error.message);
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto p-4 border rounded-lg">
      <h2 className="text-2xl font-bold">{isLogin ? "Login" : "Register"}</h2>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full p-2 border rounded"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="w-full p-2 border rounded"
      />
      {!isLogin && (
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>
      )}
      <button className="w-full p-2 bg-blue-500 text-white rounded">
        {isLogin ? "Login" : "Register"}
      </button>
    </form>
  );
}