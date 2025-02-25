// // components/ProtectedRoute.js
// import { useEffect, useState } from "react";
// import { auth } from "../firebaseConfig";
// import { onAuthStateChanged } from "firebase/auth";
// import { useRouter } from "next/router";

// export default function ProtectedRoute({ children, allowedRoles }) {
//   const [loading, setLoading] = useState(true);
//   const [authorized, setAuthorized] = useState(false);
//   const router = useRouter();

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, (user) => {
//       const role = localStorage.getItem("role");
//       if (user && allowedRoles.includes(role)) {
//         setAuthorized(true);
//       } else {
//         router.push("/login");
//       }
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, [allowedRoles, router]);

//   if (loading) return <p>Loading...</p>;

//   return authorized ? children : null;
// }


// components/ProtectedRoute.js
import { useEffect, useState } from "react";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/router";

export default function ProtectedRoute({ children, allowedRoles }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const role = localStorage.getItem("role");
      if (user && allowedRoles.includes(role)) {
        setAuthorized(true);
      } else {
        router.push("/login");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [allowedRoles, router]);

  if (loading) return <p>Loading...</p>;

  return authorized ? children : null;
}