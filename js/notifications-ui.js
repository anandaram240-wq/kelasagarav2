/*
 * notifications-ui.js — Notification Bell UI shared by both dashboards
 */
import { rtdb } from './firebase-config.js';
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

export function initNotificationBell(userId, bellContainerId) {
  const container = document.getElementById(bellContainerId);
  if (!container) return;

  container.innerHTML = `
    <div class="notif-bell-wrap" id="notif-bell-wrap">
      <button class="notif-bell-btn" id="notif-bell-btn" onclick="toggleNotifDropdown()" title="Notifications">
        🔔 <span class="notif-badge" id="notif-badge" style="display:none">0</span>
      </button>
      <div class="notif-dropdown" id="notif-dropdown" style="display:none">
        <div class="notif-dropdown-header">
          <span>Notifications</span>
          <button onclick="markAllRead('${userId}')" style="font-size:0.75rem;background:none;border:none;cursor:pointer;color:var(--saffron)">Mark all read</button>
        </div>
        <div id="notif-list"><div style="padding:1rem;text-align:center;color:#999;font-size:0.85rem">No notifications yet</div></div>
      </div>
    </div>`;

  window.toggleNotifDropdown = function() {
    const dd = document.getElementById('notif-dropdown');
    dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
  };
  document.addEventListener('click', e => {
    if (!e.target.closest('#notif-bell-wrap')) {
      const dd = document.getElementById('notif-dropdown');
      if (dd) dd.style.display = 'none';
    }
  });

  const notifRef = ref(rtdb, `notifications/${userId}`);
  onValue(notifRef, snap => {
    const items = [];
    snap.forEach(c => items.push({ id: c.key, ...c.val() }));
    items.reverse();
    const unread = items.filter(i => !i.isRead).length;
    const badge  = document.getElementById('notif-badge');
    if (badge) {
      badge.textContent = unread > 9 ? '9+' : unread;
      badge.style.display = unread > 0 ? 'inline-flex' : 'none';
    }
    const list = document.getElementById('notif-list');
    if (!list) return;
    if (!items.length) {
      list.innerHTML = '<div style="padding:1rem;text-align:center;color:#999;font-size:0.85rem">No notifications yet</div>';
      return;
    }
    list.innerHTML = items.slice(0, 15).map(n => `
      <div class="notif-item ${n.isRead ? '' : 'unread'}" onclick="readNotif('${userId}','${n.id}','${n.bookingId||''}')">
        <div class="notif-icon">${getNotifIcon(n.type)}</div>
        <div class="notif-body">
          <div class="notif-title">${n.type === 'BOOKING_REQUEST' ? 'New Booking Request' : n.type === 'BOOKING_CONFIRMED' ? '✅ Booking Confirmed' : n.type === 'BOOKING_DECLINED' ? '❌ Booking Declined' : 'Notification'}</div>
          <div class="notif-sub">${n.jobTitle || ''}</div>
          <div class="notif-time">${timeAgo(n.createdAt)}</div>
        </div>
      </div>`).join('');
  });

  window.readNotif = function(uid, nid, bookingId) {
    update(ref(rtdb, `notifications/${uid}/${nid}`), { isRead: true });
    if (bookingId) window.location.href = `booking-detail.html?id=${bookingId}`;
  };
  window.markAllRead = function(uid) {
    const updates = {};
    const notifRef2 = ref(rtdb, `notifications/${uid}`);
    onValue(notifRef2, snap => {
      snap.forEach(c => { updates[`notifications/${uid}/${c.key}/isRead`] = true; });
      if (Object.keys(updates).length) update(ref(rtdb), updates);
    }, { onlyOnce: true });
  };
}

function getNotifIcon(type) {
  return type === 'BOOKING_REQUEST' ? '📋' : type === 'BOOKING_CONFIRMED' ? '✅' : type === 'BOOKING_DECLINED' ? '❌' : '🔔';
}
function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs/24)}d ago`;
}
