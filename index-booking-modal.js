/*
 * index-booking-modal.js — Booking Modal on Homepage
 * Injected into index.html. Hirer clicks "Book Now" on a worker card.
 * Only accessible to logged-in hirers; others redirected to login.
 */

// Inject modal HTML + toast container into body
document.body.insertAdjacentHTML('beforeend', `
<div id="booking-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:800;align-items:center;justify-content:center;padding:1rem">
  <div style="background:#fff;border-radius:20px;padding:2rem;width:100%;max-width:500px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.2)">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem">
      <h3 style="font-family:'Baloo Tamma 2',cursive;font-size:1.2rem;color:#0F1923">📅 Book Worker</h3>
      <button onclick="closeBookingModal()" style="background:none;border:none;font-size:1.5rem;cursor:pointer;color:#7A6A58;line-height:1">✕</button>
    </div>
    <div id="booking-worker-name" style="font-weight:600;font-size:0.95rem;color:#E8590C;margin-bottom:1.1rem;background:#FEF0E6;padding:8px 12px;border-radius:8px"></div>
    <div style="margin-bottom:12px">
      <label style="display:block;font-size:0.82rem;font-weight:600;color:#0F1923;margin-bottom:4px">Job Title / Type of Work *</label>
      <input id="bk-jobtitle" type="text" placeholder="e.g. House Painting, Plumbing repair" style="width:100%;padding:9px 12px;border:1.5px solid rgba(180,130,70,0.2);border-radius:10px;font-size:0.88rem;font-family:'DM Sans',sans-serif;outline:none"/>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div>
        <label style="display:block;font-size:0.82rem;font-weight:600;color:#0F1923;margin-bottom:4px">Date *</label>
        <input id="bk-date" type="date" style="width:100%;padding:9px 12px;border:1.5px solid rgba(180,130,70,0.2);border-radius:10px;font-size:0.88rem;font-family:'DM Sans',sans-serif;outline:none"/>
      </div>
      <div>
        <label style="display:block;font-size:0.82rem;font-weight:600;color:#0F1923;margin-bottom:4px">Time *</label>
        <input id="bk-time" type="time" style="width:100%;padding:9px 12px;border:1.5px solid rgba(180,130,70,0.2);border-radius:10px;font-size:0.88rem;font-family:'DM Sans',sans-serif;outline:none"/>
      </div>
    </div>
    <div style="margin-bottom:12px">
      <label style="display:block;font-size:0.82rem;font-weight:600;color:#0F1923;margin-bottom:4px">Location / Address *</label>
      <input id="bk-location" type="text" placeholder="Full address where work is needed" style="width:100%;padding:9px 12px;border:1.5px solid rgba(180,130,70,0.2);border-radius:10px;font-size:0.88rem;font-family:'DM Sans',sans-serif;outline:none"/>
    </div>
    <div style="margin-bottom:16px">
      <label style="display:block;font-size:0.82rem;font-weight:600;color:#0F1923;margin-bottom:4px">Special Instructions (optional)</label>
      <textarea id="bk-notes" placeholder="Any specific requirements, tools needed, etc." style="width:100%;padding:9px 12px;border:1.5px solid rgba(180,130,70,0.2);border-radius:10px;font-size:0.88rem;font-family:'DM Sans',sans-serif;outline:none;resize:vertical;min-height:80px"></textarea>
    </div>
    <button id="bk-confirm-btn" onclick="confirmBooking()" style="width:100%;padding:12px;background:#E8590C;color:#fff;border:none;border-radius:12px;font-size:1rem;font-weight:700;cursor:pointer;font-family:'DM Sans',sans-serif;transition:all 0.2s">✅ Confirm Booking</button>
  </div>
</div>
<div id="bk-toast-container" style="position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:8px"></div>
`);

let _workerId = null, _workerName = null;

window.openBookingModal = async function(workerId, workerName) {
  // Must be logged in as hirer
  const { auth, db }       = await import('./js/firebase-config.js');
  const { onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
  const { doc, getDoc }    = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

  const user = auth.currentUser;
  if (!user) { window.location.href = 'login.html?role=hirer'; return; }

  const snap = await getDoc(doc(db, 'users', user.uid));
  if (!snap.exists() || snap.data().role !== 'hirer') {
    window.location.href = 'login.html?role=hirer'; return;
  }

  _workerId  = workerId;
  _workerName = workerName;
  document.getElementById('booking-worker-name').textContent = '👷 ' + workerName;
  document.getElementById('bk-date').min = new Date().toISOString().split('T')[0];
  // Reset form
  ['bk-jobtitle','bk-date','bk-time','bk-location','bk-notes'].forEach(id=>{
    document.getElementById(id).value='';
  });
  const overlay = document.getElementById('booking-overlay');
  overlay.style.display = 'flex';
};

window.closeBookingModal = function() {
  document.getElementById('booking-overlay').style.display = 'none';
};

// Close when clicking outside the modal box
document.getElementById('booking-overlay').addEventListener('click', function(e){
  if (e.target === this) closeBookingModal();
});

window.confirmBooking = async function() {
  const jobTitle     = document.getElementById('bk-jobtitle').value.trim();
  const date         = document.getElementById('bk-date').value;
  const time         = document.getElementById('bk-time').value;
  const location     = document.getElementById('bk-location').value.trim();
  const instructions = document.getElementById('bk-notes').value.trim();

  if (!jobTitle)  { bkToast('Enter a job title', 'error'); return; }
  if (!date)      { bkToast('Select a date', 'error'); return; }
  if (!time)      { bkToast('Select a time', 'error'); return; }
  if (!location)  { bkToast('Enter the work location', 'error'); return; }

  const btn = document.getElementById('bk-confirm-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Sending…';

  try {
    const { auth }           = await import('./js/firebase-config.js');
    const { createBooking }  = await import('./js/bookings.js');
    const user = auth.currentUser;
    if (!user) { window.location.href='login.html?role=hirer'; return; }

    await createBooking(user.uid, _workerId, { jobTitle, date, time, location, instructions });
    closeBookingModal();
    bkToast('✅ Booking sent! Worker will be notified in real-time.', 'success');
  } catch(e) {
    console.error(e);
    bkToast('Failed to send booking. Please try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '✅ Confirm Booking';
  }
};

function bkToast(msg, type='info') {
  const c = document.getElementById('bk-toast-container');
  const cols = { success:'#1B6B45', error:'#C0392B', info:'#E8590C' };
  const t = document.createElement('div');
  t.style.cssText = `min-width:260px;max-width:360px;padding:12px 18px;background:${cols[type]||cols.info};color:#fff;border-radius:10px;font-size:0.9rem;font-weight:500;display:flex;align-items:center;gap:8px;box-shadow:0 8px 24px rgba(0,0,0,0.15)`;
  t.innerHTML = `<span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
