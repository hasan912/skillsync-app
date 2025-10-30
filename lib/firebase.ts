import { initializeApp, getApps } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyDTEQ_gsC-ci1NcMvySUIYNebgw5VjL38Q",
  authDomain: "skillsync-fa20e.firebaseapp.com",
  projectId: "skillsync-fa20e",
  storageBucket: "skillsync-fa20e.firebasestorage.app",
  messagingSenderId: "208013345475",
  appId: "1:208013345475:web:594cf3b38783d6b06e1876",
  measurementId: "G-1GX70KP2QM",
}

const apps = getApps()
const app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0]

export const auth = getAuth(app)
export const db = getFirestore(app)
