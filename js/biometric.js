// ─────────────────────────────────────────────────────────────
// KelasaGaara — Biometric (WebAuthn / Passkey) Module v2
// Supports Face ID, Fingerprint, Windows Hello, Touch ID
// ─────────────────────────────────────────────────────────────
import { db } from './firebase-config.js';
import {
  collection, doc, setDoc, getDocs, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Constants ─────────────────────────────────────────────────
const RP_ID = (() => {
  const h = location.hostname;
  if (h === 'localhost' || h === '127.0.0.1') return 'localhost';
  // Use registered domain for production
  return h;
})();

const LS_CREDS_KEY = 'kelasa_bio_creds';
const LS_UID_KEY   = 'kelasa_bio_uid';
const LS_NAME_KEY  = 'kelasa_bio_name';

// ── Base64 Helpers ────────────────────────────────────────────
export function bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}
export function b64ToBuf(b64) {
  const s = atob(b64.replace(/-/g,'+').replace(/_/g,'/'));
  return Uint8Array.from(s, c => c.charCodeAt(0)).buffer;
}
function randomBuf(len = 32) {
  return crypto.getRandomValues(new Uint8Array(len)).buffer;
}

// ── Device Detection ──────────────────────────────────────────
export function getDeviceLabel() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua))  return 'Face ID / Touch ID';
  if (/Android/.test(ua))      return 'Fingerprint';
  if (/Win/.test(ua))          return 'Windows Hello';
  if (/Mac/.test(ua))          return 'Touch ID';
  return 'Biometric';
}

export function getDeviceIcon() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua))  return '👤';
  if (/Android/.test(ua))      return '👆';
  if (/Win/.test(ua))          return '🪟';
  if (/Mac/.test(ua))          return '👆';
  return '🔐';
}

// ── Feature Detection ─────────────────────────────────────────
export async function isBiometricSupported() {
  try {
    if (!window.PublicKeyCredential) return false;
    if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export async function isConditionalMediationSupported() {
  try {
    return typeof PublicKeyCredential.isConditionalMediationAvailable === 'function' &&
      await PublicKeyCredential.isConditionalMediationAvailable();
  } catch {
    return false;
  }
}

// ── REGISTER Biometric ────────────────────────────────────────
export async function registerBiometric(uid, userName) {
  const challenge = randomBuf(32);
  const userId    = new TextEncoder().encode(uid);

  const options = {
    challenge,
    rp: {
      name: 'KelasaGaara',
      id: RP_ID
    },
    user: {
      id: userId,
      name: uid,
      displayName: userName || 'User'
    },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7   },   // ES256 (preferred)
      { type: 'public-key', alg: -257 },   // RS256
      { type: 'public-key', alg: -37  }    // PS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',  // Use built-in sensor
      userVerification: 'required',
      residentKey: 'required',              // Enable discoverable cred
      requireResidentKey: true
    },
    timeout: 120000,  // 2 min for slower devices
    attestation: 'none',
    extensions: {
      credProps: true  // Get credential properties
    }
  };

  let cred;
  try {
    cred = await navigator.credentials.create({ publicKey: options });
  } catch (err) {
    // Rethrow with friendly messages
    if (err.name === 'NotAllowedError') {
      throw new Error('Biometric setup cancelled. Please try again.');
    }
    if (err.name === 'InvalidStateError') {
      throw new Error('A passkey is already registered on this device.');
    }
    if (err.name === 'NotSupportedError') {
      throw new Error('Your device does not support biometric authentication.');
    }
    throw err;
  }

  const credId = bufToB64(cred.rawId);
  let pubKey = '';
  try {
    if (cred.response.getPublicKey) {
      const pk = cred.response.getPublicKey();
      pubKey = pk ? bufToB64(pk) : '';
    }
  } catch {}

  // Store in Firestore
  await setDoc(doc(db, 'users', uid, 'biometric', credId), {
    credentialId: credId,
    publicKey: pubKey,
    deviceLabel: getDeviceLabel(),
    counter: 0,
    createdAt: serverTimestamp(),
    lastUsed: null
  });

  // Cache in localStorage for instant retrieval
  const stored = JSON.parse(localStorage.getItem(LS_CREDS_KEY) || '[]');
  if (!stored.includes(credId)) stored.push(credId);
  localStorage.setItem(LS_CREDS_KEY, JSON.stringify(stored));
  localStorage.setItem(LS_UID_KEY, uid);
  localStorage.setItem(LS_NAME_KEY, userName || 'User');

  return credId;
}

// ── AUTHENTICATE Biometric ────────────────────────────────────
export async function authenticateBiometric(uid) {
  // Try Firestore first for most up-to-date credentials
  let allowCreds = [];
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'biometric'));
    if (!snap.empty) {
      allowCreds = snap.docs.map(d => ({
        id: b64ToBuf(d.data().credentialId),
        type: 'public-key',
        transports: ['internal']
      }));
    }
  } catch {
    // Fallback to localStorage
    const stored = JSON.parse(localStorage.getItem(LS_CREDS_KEY) || '[]');
    if (stored.length === 0) throw new Error('No biometric credentials found.');
    allowCreds = stored.map(credId => ({
      id: b64ToBuf(credId),
      type: 'public-key',
      transports: ['internal']
    }));
  }

  if (allowCreds.length === 0) throw new Error('No biometric registered on this device.');

  const challenge = randomBuf(32);
  let assertion;
  try {
    assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: allowCreds,
        userVerification: 'required',
        timeout: 60000
      }
    });
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      throw new Error('Biometric verification cancelled.');
    }
    if (err.name === 'SecurityError') {
      throw new Error('Security error. Please try Google login instead.');
    }
    throw err;
  }

  const returnedId = bufToB64(assertion.rawId);

  // Update last used timestamp in background
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'biometric'));
    const matched = snap.docs.find(d => d.data().credentialId === returnedId);
    if (matched) {
      // Update counter + last used
      setDoc(doc(db, 'users', uid, 'biometric', returnedId), {
        ...matched.data(),
        lastUsed: serverTimestamp(),
        counter: (matched.data().counter || 0) + 1
      }).catch(() => {});
    }
  } catch {}

  return { credentialId: returnedId, uid };
}

// ── DISCOVERABLE: Auto-fill passkey (no uid needed) ──────────
export async function discoverBiometric() {
  if (!await isConditionalMediationSupported()) return null;
  try {
    const challenge = randomBuf(32);
    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        allowCredentials: [],  // Empty = discover any passkey
        userVerification: 'required',
        timeout: 60000
      },
      mediation: 'conditional'
    });
    const credId = bufToB64(assertion.rawId);
    const uid = localStorage.getItem(LS_UID_KEY);
    return uid ? { credentialId: credId, uid } : null;
  } catch {
    return null;
  }
}

// ── LIST DEVICES ──────────────────────────────────────────────
export async function listBiometricDevices(uid) {
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'biometric'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch {
    return [];
  }
}

// ── REMOVE DEVICE ─────────────────────────────────────────────
export async function removeBiometricDevice(uid, credentialId) {
  await deleteDoc(doc(db, 'users', uid, 'biometric', credentialId));
  const stored = JSON.parse(localStorage.getItem(LS_CREDS_KEY) || '[]');
  const updated = stored.filter(c => c !== credentialId);
  localStorage.setItem(LS_CREDS_KEY, JSON.stringify(updated));
  // If no creds left, clear uid
  if (updated.length === 0) {
    localStorage.removeItem(LS_UID_KEY);
    localStorage.removeItem(LS_NAME_KEY);
  }
}

// ── LOCAL HELPERS ─────────────────────────────────────────────
export function hasLocalBiometric() {
  return !!localStorage.getItem(LS_UID_KEY) &&
    JSON.parse(localStorage.getItem(LS_CREDS_KEY) || '[]').length > 0;
}

export function getLocalBiometricUid() {
  return localStorage.getItem(LS_UID_KEY);
}

export function getLocalBiometricName() {
  return localStorage.getItem(LS_NAME_KEY) || 'User';
}

export function clearLocalBiometric() {
  localStorage.removeItem(LS_UID_KEY);
  localStorage.removeItem(LS_CREDS_KEY);
  localStorage.removeItem(LS_NAME_KEY);
}
