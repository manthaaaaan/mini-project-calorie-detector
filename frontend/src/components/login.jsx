import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

export default function Login({ onLogin }) {
  const handleGoogleLogin = async () => {
    try {
      const result = await FirebaseAuthentication.signInWithGoogle();
      if (onLogin) onLogin(result.user);
    } catch (err) {
      alert("Login failed: " + err.message);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <circle cx="20" cy="20" r="20" fill="#8a7dff" opacity="0.15" />
            <path d="M20 8 C12 8 8 14 8 20 C8 28 14 32 20 32 C26 32 32 28 32 20 C32 14 28 8 20 8Z"
              fill="none" stroke="#8a7dff" strokeWidth="1.5" />
            <path d="M15 20 C15 17 17 15 20 15 C23 15 25 17 25 20 C25 23 23 25 20 25"
              fill="none" stroke="#43ddff" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="20" cy="20" r="2.5" fill="#8a7dff" />
          </svg>
          <h1 style={styles.appName}>CalorieAI</h1>
        </div>

        <p style={styles.tagline}>Your personal nutrition coach</p>

        <div style={styles.divider} />

        <button style={styles.googleBtn} onClick={handleGoogleLogin}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
          Continue with Google
        </button>

        <p style={styles.terms}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "#0d0d14",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Inter', sans-serif",
    padding: "24px",
  },
  card: {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: "48px 40px",
    width: "100%",
    maxWidth: 380,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    boxShadow: "0 24px 80px rgba(0,0,0,0.4)",
    backdropFilter: "blur(20px)",
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  appName: {
    fontSize: 26,
    fontWeight: 800,
    color: "#fff",
    letterSpacing: "-0.5px",
    margin: 0,
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255,255,255,0.45)",
    margin: 0,
    textAlign: "center",
  },
  divider: {
    width: "100%",
    height: 1,
    background: "rgba(255,255,255,0.07)",
    margin: "8px 0",
  },
  googleBtn: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    background: "#fff",
    color: "#111",
    border: "none",
    borderRadius: 12,
    padding: "14px 24px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.15s",
    fontFamily: "'Inter', sans-serif",
  },
  terms: {
    fontSize: 11,
    color: "rgba(255,255,255,0.25)",
    textAlign: "center",
    lineHeight: 1.6,
    margin: 0,
  },
};