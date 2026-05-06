/*
 * bookings.js — Booking system helpers
 * Save bookings to Firestore + real-time notifications via RTDB
 * Terminology: hirerId / workerId (Hirer stays as Hirer)
 */
import { db, rtdb } from './firebase-config.js';
import {
  collection, addDoc, updateDoc, doc, serverTimestamp, getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ref, push, onValue, update }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// Create a new booking (called by hirer after clicking Book Now)
export async function createBooking(hirerId, workerId, form) {
  const bookingRef = await addDoc(collection(db, 'bookings'), {
    hirerId, workerId,
    jobTitle:     form.jobTitle,
    date:         form.date,
    time:         form.time,
    location:     form.location,
    instructions: form.instructions || '',
    status:       'PENDING',
    createdAt:    serverTimestamp(),
    updatedAt:    serverTimestamp()
  });

  // Real-time push to worker via RTDB
  await push(ref(rtdb, `notifications/${workerId}`), {
    type:      'BOOKING_REQUEST',
    bookingId: bookingRef.id,
    hirerId,
    jobTitle:  form.jobTitle,
    date:      form.date,
    time:      form.time,
    location:  form.location,
    isRead:    false,
    shown:     false,
    createdAt: Date.now()
  });

  // Also persist to Firestore notifications collection
  await addDoc(collection(db, 'notifications'), {
    userId:    workerId,
    type:      'BOOKING_REQUEST',
    title:     'New Booking Request',
    body:      `${form.jobTitle} on ${form.date}`,
    bookingId: bookingRef.id,
    isRead:    false,
    createdAt: serverTimestamp()
  });

  return bookingRef.id;
}

// Worker responds to booking (accept/decline)
export async function respondBooking(bookingId, workerId, action) {
  const status = action === 'accept' ? 'CONFIRMED' : 'DECLINED';
  await updateDoc(doc(db, 'bookings', bookingId), {
    status,
    updatedAt: serverTimestamp()
  });

  // Get booking to notify hirer
  const bSnap = await getDoc(doc(db, 'bookings', bookingId));
  const b     = bSnap.data();

  // Notify hirer via RTDB
  await push(ref(rtdb, `notifications/${b.hirerId}`), {
    type:      status === 'CONFIRMED' ? 'BOOKING_CONFIRMED' : 'BOOKING_DECLINED',
    bookingId,
    workerId,
    jobTitle:  b.jobTitle,
    isRead:    false,
    createdAt: Date.now()
  });

  // Persist to Firestore
  await addDoc(collection(db, 'notifications'), {
    userId:    b.hirerId,
    type:      status === 'CONFIRMED' ? 'BOOKING_CONFIRMED' : 'BOOKING_DECLINED',
    title:     status === 'CONFIRMED' ? '✅ Booking Confirmed!' : '❌ Booking Declined',
    body:      `${b.jobTitle} — ${status.toLowerCase()} by worker`,
    bookingId,
    isRead:    false,
    createdAt: serverTimestamp()
  });
}

// Listen for incoming notifications for a user (RTDB)
export function listenUserNotifications(userId, callback) {
  return onValue(ref(rtdb, `notifications/${userId}`), snap => {
    const items = [];
    snap.forEach(child => items.push({ id: child.key, ...child.val() }));
    callback(items.reverse());
  });
}

// Mark a single notification as read
export function markNotifRead(userId, notifId) {
  return update(ref(rtdb, `notifications/${userId}/${notifId}`), { isRead: true });
}
