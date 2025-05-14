// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBy1xfYvbC1LIFMqSd97uYOzVC3rY-xSZk",
  authDomain: "delivery-f74f7.firebaseapp.com",
  projectId: "delivery-f74f7",
  storageBucket: "delivery-f74f7.firebasestorage.app",
  messagingSenderId: "166530116871",
  appId: "1:166530116871:web:4f12be9c61b83c796ce9a2",
  measurementId: "G-WRZ2LBF3KZ"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;

export { app, db, auth, storage, analytics };