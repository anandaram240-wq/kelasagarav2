/*
 * chat.js — Real-time messenger using Firebase RTDB
 * Messages linked to bookingId. Only available after CONFIRMED booking.
 */
import { rtdb } from './firebase-config.js';
import { ref, push, onValue, update, serverTimestamp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

export function sendMessage(bookingId, senderId, senderRole, receiverId, text) {
  const msgsRef = ref(rtdb, `chats/${bookingId}/messages`);
  return push(msgsRef, {
    senderId, senderRole, receiverId,
    messageText: text,
    timestamp:   Date.now(),
    isRead:      false
  });
}

export function listenMessages(bookingId, callback) {
  const msgsRef = ref(rtdb, `chats/${bookingId}/messages`);
  return onValue(msgsRef, snap => {
    const msgs = [];
    snap.forEach(child => msgs.push({ id: child.key, ...child.val() }));
    callback(msgs);
  });
}

export function markMessagesRead(bookingId, messageIds, receiverId) {
  const updates = {};
  messageIds.forEach(id => {
    updates[`chats/${bookingId}/messages/${id}/isRead`] = true;
  });
  return update(ref(rtdb), updates);
}

export function setOnlineStatus(userId, isOnline) {
  return update(ref(rtdb, `presence/${userId}`), {
    online: isOnline, lastSeen: Date.now()
  });
}

export function listenOnlineStatus(userId, callback) {
  return onValue(ref(rtdb, `presence/${userId}`), snap => {
    callback(snap.val() || { online: false });
  });
}
