/*
 * auth.js — Authentication & Route Protection
 * Handles Google Sign-In, logout, role saving to Firestore,
 * redirect logic after login, and checkAuth() to guard pages.
 */

import { auth, db } from './firebase-config.js';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { showToast } from './app.js';

// ===== GOOGLE AUTH PROVIDER SETUP =====
// GoogleAuthProvider is the object that tells Firebase to use Google as login.
const provider = new GoogleAuthProvider();
// Ask Google to show account-picker even if user is already signed in.
provider.setCustomParameters({ prompt: 'select_account' });

// ===== GOOGLE SIGN-IN FUNCTION =====
// Called when user clicks "Continue with Google" on login.html.
// selectedRole is either 'worker' or 'hirer', chosen before clicking.
export async function signInWithGoogle(selectedRole) {
  // Validate that the user has chosen a role before trying to sign in.
  if (!selectedRole) {
    showToast('Please select a role first — Worker or Hirer.', 'error');
    return;
  }

  try {
    // Open the Google sign-in popup window.
    const result = await signInWithPopup(auth, provider);
    const user = result.user; // The Google user object (name, email, photo, uid)

    // Check if this user already exists in Firestore.
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // NEW USER: Create their Firestore document with their selected role.
      await setDoc(userRef, {
        uid:       user.uid,
        name:      user.displayName,
        email:     user.email,
        photo:     user.photoURL,
        role:      selectedRole,       // 'worker' or 'hirer'
        skills:    [],                 // Workers start with empty skills list
        createdAt: serverTimestamp(),  // When they first joined
        lastLogin: serverTimestamp()
      });
      showToast(`Welcome to KelasaGaara, ${user.displayName}! 🎉`, 'success');
    } else {
      // EXISTING USER: Only update their last login time, keep role unchanged.
      await updateDoc(userRef, {
        lastLogin: serverTimestamp()
      });
      showToast(`Welcome back, ${user.displayName}! 👋`, 'info');
    }

    // Read their role from Firestore (use saved role for existing users).
    const savedData = (await getDoc(userRef)).data();
    const role = savedData.role;

    // Redirect to the correct dashboard based on role.
    redirectByRole(role);

  } catch (err) {
    // Show an error toast if sign-in fails.
    console.error('Sign-in error:', err);
    showToast('Sign-in failed. Please try again.', 'error');
  }
}

// ===== REDIRECT BY ROLE =====
// Sends the user to the right dashboard based on their role.
function redirectByRole(role) {
  if (role === 'worker') {
    window.location.href = 'worker-dashboard.html';
  } else if (role === 'hirer') {
    window.location.href = 'hirer-dashboard.html';
  } else {
    // Unknown role — send back to login.
    window.location.href = 'login.html';
  }
}

// ===== LOGOUT FUNCTION =====
// Signs the user out of Firebase and sends them to login.html.
export async function logout() {
  try {
    await signOut(auth);
    window.location.href = 'login.html';
  } catch (err) {
    console.error('Logout error:', err);
    showToast('Logout failed. Please try again.', 'error');
  }
}

// ===== CHECKAUTH FUNCTION =====
// Call this on every dashboard page to protect it.
// If no user is logged in, redirect to login.html immediately.
// Returns: the Firestore user data object if authenticated.
export async function checkAuth() {
  return new Promise((resolve, reject) => {
    // onAuthStateChanged fires once on page load with current auth state.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe(); // Stop listening after first check

      if (!user) {
        // No logged-in user → redirect to login page.
        window.location.href = 'login.html';
        reject('Not authenticated');
        return;
      }

      try {
        // Fetch user data from Firestore to get their role and profile info.
        const userRef  = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // User authenticated but no Firestore record — send to login.
          window.location.href = 'login.html';
          reject('No user record');
          return;
        }

        // Return the complete user document data to the calling page.
        resolve({ uid: user.uid, ...userSnap.data() });

      } catch (err) {
        console.error('checkAuth error:', err);
        window.location.href = 'login.html';
        reject(err);
      }
    });
  });
}

// ===== GET CURRENT USER =====
// Simple helper to get the currently signed-in Firebase user object.
export function getCurrentUser() {
  return auth.currentUser;
}
