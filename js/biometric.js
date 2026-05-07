// ─────────────────────────────────────────────────────────────
// KelasaGaara — Biometric (WebAuthn/Passkey) Module
// ─────────────────────────────────────────────────────────────
import { db } from './firebase-config.js';
import {
  collection, doc, setDoc, getDocs, deleteDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ── Helpers ──────────────────────────────────────────────────
function bufToB64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
}
function b64ToBuf(b64) {
  const s = atob(b64.replace(/-/g,'+').replace(/_/g,'/'));
  return Uint8Array.from(s, c => c.charCodeAt(0)).buffer;
}
function randomBuf(len=32) {
  return crypto.getRandomValues(new Uint8Array(len)).buffer;
}

// ── Device Label ──────────────────────────────────────────────
export function getDeviceLabel() {
  const ua = navigator.userAgent;
  if (/iPhone|iPad/.test(ua)) return 'Face ID / Touch ID (iPhone)';
  if (/Android/.test(ua))     return 'Fingerprint (Android)';
  if (/Win/.test(ua))         return 'Windows Hello';
  if (/Mac/.test(ua))         return 'Touch ID (Mac)';
  return 'Biometric';
}

// ── Check Support ─────────────────────────────────────────────
export async function isBiometricSupported() {
  try {
    if (!window.PublicKeyCredential) return false;
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch { return false; }
}

// ── REGISTER ─────────────────────────────────────────────────
export async function registerBiometric(uid, userName) {
  const challenge = randomBuf(32);
  const userId    = new TextEncoder().encode(uid);

  const options = {
    challenge,
    rp: { name: 'KelasaGaara', id: location.hostname === 'localhost' ? 'localhost' : 'kelasagara-f127a.web.app' },
    user: { id: userId, name: uid, displayName: userName || 'User' },
    pubKeyCredParams: [
      { type: 'public-key', alg: -7  },  // ES256
      { type: 'public-key', alg: -257 }  // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred'
    },
    timeout: 60000,
    attestation: 'none'
  };

  const cred = await navigator.credentials.create({ publicKey: options });
  const credId = bufToB64(cred.rawId);
  const pubKey = bufToB64(cred.response.getPublicKey
    ? cred.response.getPublicKey() || new ArrayBuffer(0)
    : new ArrayBuffer(0));

  // Store in Firestore: users/{uid}/biometric/{credentialId}
  await setDoc(doc(db, 'users', uid, 'biometric', credId), {
    credentialId: credId,
    publicKey: pubKey,
    deviceLabel: getDeviceLabel(),
    counter: 0,
    createdAt: serverTimestamp()
  });

  // Also store credentialId in localStorage for quick lookup
  const stored = JSON.parse(localStorage.getItem('kelasa_bio_creds') || '[]');
  if (!stored.includes(credId)) stored.push(credId);
  localStorage.setItem('kelasa_bio_creds', JSON.stringify(stored));
  localStorage.setItem('kelasa_bio_uid', uid);

  return credId;
}

// ── AUTHENTICATE ──────────────────────────────────────────────
export async function authenticateBiometric(uid) {
  // Get stored credential IDs from Firestore for this uid
  const snap = await getDocs(collection(db, 'users', uid, 'biometric'));
  if (snap.empty) throw new Error('No biometric registered');

  const allowCreds = snap.docs.map(d => ({
    id: b64ToBuf(d.data().credentialId),
    type: 'public-key',
    transports: ['internal']
  }));

  const challenge = randomBuf(32);
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge,
      allowCredentials: allowCreds,
      userVerification: 'required',
      timeout: 60000
    }
  });

  // Verify the returned credentialId matches one we stored
  const returnedId = bufToB64(assertion.rawId);
  const matched = snap.docs.find(d => d.data().credentialId === returnedId);
  if (!matched) throw new Error('Credential mismatch');

  return { credentialId: returnedId, uid };
}

// ── LIST DEVICES ──────────────────────────────────────────────
export async function listBiometricDevices(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'biometric'));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── REMOVE DEVICE ─────────────────────────────────────────────
export async function removeBiometricDevice(uid, credentialId) {
  await deleteDoc(doc(db, 'users', uid, 'biometric', credentialId));
  // Clean localStorage
  const stored = JSON.parse(localStorage.getItem('kelasa_bio_creds') || '[]');
  localStorage.setItem('kelasa_bio_creds', JSON.stringify(stored.filter(c => c !== credentialId)));
}

// ── CHECK IF DEVICE HAS BIOMETRIC ─────────────────────────────
export function hasLocalBiometric() {
  return !!localStorage.getItem('kelasa_bio_uid') &&
    JSON.parse(localStorage.getItem('kelasa_bio_creds') || '[]').length > 0;
}
export function getLocalBiometricUid() {
  return localStorage.getItem('kelasa_bio_uid');
}
