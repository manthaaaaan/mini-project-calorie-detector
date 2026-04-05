import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import App from "./App.jsx";
import Login from "./components/login.jsx";
import "./styles.css";  // ← change from "./index.css"

function Root() {
  const [user, setUser] = useState(undefined); // undefined = loading

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
    });
    return unsub;
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
  };

  // Still checking auth state
  if (user === undefined) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0d0d14",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "rgba(255,255,255,0.4)",
        fontFamily: "Inter, sans-serif",
        fontSize: 14,
      }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={(u) => setUser(u)} />;
  }

  return <App user={user} onSignOut={handleSignOut} />;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Root />
  </StrictMode>
);