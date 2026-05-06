/*
 * firebase-config.js — Firebase Initialization
 * Project: kelasagara-f127a (NEW production project)
 * Exports: app, auth, db (Firestore), rtdb (Realtime Database)
 */
import { initializeApp }   from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth }         from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore }    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getDatabase }     from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey:            "AIzaSyAvV3uX383CaTJu9_uJ7pFGtqFwK2v73Pk",
  authDomain:        "kelasagara-f127a.firebaseapp.com",
  databaseURL:       "https://kelasagara-f127a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "kelasagara-f127a",
  storageBucket:     "kelasagara-f127a.firebasestorage.app",
  messagingSenderId: "993968093461",
  appId:             "1:993968093461:web:dc8424333fef88cb47d11c",
  measurementId:     "G-TT0VWJ1MT1"
};

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);
const rtdb = getDatabase(app);

export { app, auth, db, rtdb };
