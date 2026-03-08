import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCBz1golPWPerJdkqm1XVce8F3-kCX54o0",
  authDomain: "ylaaf-store.firebaseapp.com",
  projectId: "ylaaf-store",
  storageBucket: "ylaaf-store.firebasestorage.app",
  messagingSenderId: "810035958427",
  appId: "1:810035958427:web:8f0dab1c88e41ad4adac3e"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);