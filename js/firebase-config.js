/*
 * firebase-config.js — Firebase Initialization
 * Initializes the Firebase app with the project config.
 * Exports: app, auth, db (Firestore), rtdb (Realtime Database)
 */

import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }         from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getDatabase }     from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey:            "AIzaSyB8Sc_7sPudR-nhcL9lkTr17x6cc19zBqc",
  authDomain:        "kelasagara-ddfa9.firebaseapp.com",
  projectId:         "kelasagara-ddfa9",
  storageBucket:     "kelasagara-ddfa9.firebasestorage.app",
  messagingSenderId: "874258451573",
  appId:             "1:874258451573:web:32cc5f8f866a581966bc3c",
  databaseURL:       "https://kelasagara-ddfa9-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const rtdb = getDatabase(app);

export { app, auth, db, rtdb };
