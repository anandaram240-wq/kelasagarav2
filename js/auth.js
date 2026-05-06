/*
 * auth.js — Authentication & Route Protection
 * Handles Google Sign-In, logout, role saving to Firestore,
 * redirect logic after login, and checkAuth() to guard pages.
 * Terminology: hirer/worker roles
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

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: 'select_account' });

// ===== GOOGLE SIGN-IN FUNCTION =====
// selectedRole: 'worker' | 'hirer' | null (for admin)
export async function signInWithGoogle(selectedRole, opts = {}) {
  if (!selectedRole && !opts.skipRoleCheck) {
    showToast('Please select a role first — Worker or Hirer.', 'error');
    return null;
  }

  try {
    const result = await signInWithPopup(auth, provider);
    const user   = result.user;

    if (opts.skipRoleCheck) return user;

    const userRef  = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid:             user.uid,
        name:            user.displayName,
        email:           user.email,
        photo:           user.photoURL,
        role:            selectedRole,
        skills:          [],
        profileComplete: false,
        createdAt:       serverTimestamp(),
        lastLogin:       serverTimestamp()
      });
      showToast(`Welcome! Let's set up your profile 👷`, 'success');
      window.location.href = 'setup-profile.html';
      return user;
    } else {
      await updateDoc(userRef, { lastLogin: serverTimestamp() });
      const savedData = (await getDoc(userRef)).data();
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
export function redirectByRole(role) {
  if (role === 'worker') {
    window.location.href = 'worker-dashboard.html';
  } else if (role === 'hirer') {
    window.location.href = 'hirer-dashboard.html';
  } else {
    window.location.href = 'login.html';
  }
}

// ===== LOGOUT =====
export async function logout() {
  try {
    await signOut(auth);
    window.location.href = 'login.html';
  } catch (err) {
    console.error('Logout error:', err);
    showToast('Logout failed. Please try again.', 'error');
  }
}

// ===== CHECKAUTH =====
export async function checkAuth() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      unsubscribe();
      if (!user) {
        window.location.href = 'login.html';
        reject('Not authenticated');
        return;
      }
      try {
        const userRef  = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          window.location.href = 'login.html';
          reject('No user record');
          return;
        }
        resolve({ uid: user.uid, ...userSnap.data() });
      } catch (err) {
        console.error('checkAuth error:', err);
        window.location.href = 'login.html';
        reject(err);
      }
    });
  });
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function onAuthReady(callback) {
  const unsub = onAuthStateChanged(auth, (user) => {
    unsub();
    callback(user);
  });
}
