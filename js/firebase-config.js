/*
 * firebase-config.js — Firebase Initialization
 * Initializes the Firebase app with the project config.
 * Exports: app, auth, db — imported by all other JS files.
 */

// ===== FIREBASE SDK IMPORTS (CDN modules) =====
// We use the modular v9 SDK via CDN compat build for simpler syntax.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }       from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ===== FIREBASE PROJECT CONFIG =====
// This is the KelasaGaara Firebase project (kelasagara-ddfa9).
// Firebase Console: https://console.firebase.google.com/project/kelasagara-ddfa9
const firebaseConfig = {
  apiKey:            "AIzaSyB8Sc_7sPudR-nhcL9lkTr17x6cc19zBqc",
  authDomain:        "kelasagara-ddfa9.firebaseapp.com",
  projectId:         "kelasagara-ddfa9",
  storageBucket:     "kelasagara-ddfa9.firebasestorage.app",
  messagingSenderId: "874258451573",
  appId:             "1:874258451573:web:32cc5f8f866a581966bc3c"
};

// ===== INITIALIZE FIREBASE APP =====
// initializeApp sets up the connection to Firebase services.
const app = initializeApp(firebaseConfig);

// ===== INITIALIZE AUTH SERVICE =====
// getAuth returns the Authentication service for this app.
const auth = getAuth(app);

// ===== INITIALIZE FIRESTORE SERVICE =====
// getFirestore returns the Firestore database instance.
const db = getFirestore(app);

// ===== EXPORT SERVICES =====
// Other JS files import these to use Firebase features.
export { app, auth, db };
