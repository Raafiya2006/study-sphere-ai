import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDHnB56zajnsD12AQEYXFI--5673dDLOAA",
  authDomain: "studysphere-273a4.firebaseapp.com",
  projectId: "studysphere-273a4",
  storageBucket: "studysphere-273a4.firebasestorage.app",
  messagingSenderId: "871517686661",
  appId: "1:871517686661:web:08da4fae2fd3fc2881d2ec",
  measurementId: "G-QTR2B6FGKR"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();