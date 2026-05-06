/*
 * chat.js — Real-time messenger using Firebase RTDB
 */
import { rtdb } from './firebase-config.js';
import { ref, push, onValue, update }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

export function sendMessage(bookingId, senderId, senderRole, receiverId, text) {
  return push(ref(rtdb, `chats/${bookingId}/messages`), {
    senderId, senderRole, receiverId,
    messageText: text,
    timestamp:   Date.now(),
    isRead:      false
  });
}

export function listenMessages(bookingId, callback) {
  return onValue(ref(rtdb, `chats/${bookingId}/messages`), snap => {
    const msgs = [];
    snap.forEach(c => msgs.push({ id: c.key, ...c.val() }));
    callback(msgs);
  });
}

// Debounced — avoids triggering onValue loop by batching read receipts
let _readTimer = null;
export function markMessagesRead(bookingId, messageIds) {
  clearTimeout(_readTimer);
  _readTimer = setTimeout(() => {
    const updates = {};
    messageIds.forEach(id => {
      updates[`chats/${bookingId}/messages/${id}/isRead`] = true;
    });
    update(ref(rtdb), updates).catch(() => {});
  }, 1500);
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
