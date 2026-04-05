import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBsHa72DKj01xwWL0yGYz0GtQTQ6jIIRAU",
  authDomain: "calorie-ai-4c320.firebaseapp.com",
  projectId: "calorie-ai-4c320",
  storageBucket: "calorie-ai-4c320.firebasestorage.app",
  messagingSenderId: "175994448598",
  appId: "1:175994448598:web:dc7e15c521a89c1ad37777",
  measurementId: "G-MT84634GVL",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });