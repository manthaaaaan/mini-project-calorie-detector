import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { FirebaseAuthentication } from "@capacitor-firebase/authentication";
import { auth } from "./firebase";
import App from "./App";
import Login from "./components/Login";
import "./styles.css";

function Root() {
  const [user, setUser] = useState(undefined);

useEffect(() => {
    // Listen to Capacitor plugin auth state
    FirebaseAuthentication.addListener("authStateChange", (result) => {
      setUser(result.user ?? null);
    });

    // Also listen to Firebase web SDK auth state
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
    });

    // Check current user immediately
    FirebaseAuthentication.getCurrentUser().then((result) => {
      if (result.user) {
        setUser(result.user);
      }
    });

    return () => unsubscribe();
  }, []);

  if (user === undefined) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0d0d14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{
          width: 40, height: 40,
          border: "3px solid rgba(138,125,255,0.2)",
          borderTop: "3px solid #8a7dff",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user) return <Login />;

  return <App user={user} onSignOut={() => signOut(auth)} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);