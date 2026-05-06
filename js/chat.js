/*
 * chat.js — Helper exports for presence only.
 * Messages are now handled directly in chat.html via push/onChildAdded.
 */
import { rtdb } from './firebase-config.js';
import { ref, onValue, update }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

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
