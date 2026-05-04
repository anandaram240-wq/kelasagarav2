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
// opts.skipRoleCheck = true is used by admin-login.html (no role needed)
export async function signInWithGoogle(selectedRole, opts = {}) {
  // For normal login, require a role selection
  if (!selectedRole && !opts.skipRoleCheck) {
    showToast('Please select a role first — Worker or Hirer.', 'error');
    return null;
  }

  try {
    // Open the Google sign-in popup window.
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Admin flow: skip Firestore write, just return the raw user
    if (opts.skipRoleCheck) return user;

    // Check if this user already exists in Firestore.
    const userRef  = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // NEW USER — create Firestore doc, then send to profile setup
      await setDoc(userRef, {
        uid:             user.uid,
        name:            user.displayName,
        email:           user.email,
        photo:           user.photoURL,
        role:            selectedRole,
        skills:          [],
        profileComplete: false,        // ← must complete setup-profile.html first
        createdAt:       serverTimestamp(),
        lastLogin:       serverTimestamp()
      });
      showToast(`Welcome! Let's set up your profile 👷`, 'success');
      window.location.href = 'setup-profile.html';  // ← collect district/taluk/trade
      return user;
    } else {
      // EXISTING USER — update last login
      await updateDoc(userRef, { lastLogin: serverTimestamp() });
      const savedData = (await getDoc(userRef)).data();
      // If profile not complete, send back to setup
      if (!savedData.profileComplete) {
        window.location.href = 'setup-profile.html';
        return user;
      }
      showToast(`Welcome back, ${user.displayName}! 👋`, 'info');
      redirectByRole(savedData.role);
    }
    return user;

  } catch (err) {
    console.error('Sign-in error:', err);
    showToast('Sign-in failed. Please try again.', 'error');
    return null;
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
export function getCurrentUser() {
  return auth.currentUser;
}

// ===== ON AUTH READY =====
// Calls callback once Firebase auth state is resolved.
// Used by admin-login.html to auto-redirect if already signed in.
export function onAuthReady(callback) {
  const unsub = onAuthStateChanged(auth, (user) => {
    unsub();
    callback(user);
  });
}
