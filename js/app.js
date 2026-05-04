/*
 * app.js — Shared Application Helpers
 * Contains reusable utility functions used across all pages.
 * Functions: showToast(), formatDate(), truncate().
 */

// ===== CATEGORY EMOJI MAP =====
// Maps job category names to friendly emoji icons.
export const CATEGORY_EMOJI = {
  'Mason':          '🧱',
  'Plumber':        '🔧',
  'Electrician':    '⚡',
  'Carpenter':      '🪚',
  'Driver':         '🚗',
  'Cook':           '🍳',
  'Helper':         '🤝',
  'Gardener':       '🌿',
  'Security Guard': '🛡️',
  'Painter':        '🎨'
};

// ===== ALL 31 KARNATAKA DISTRICTS =====
// Used in the post-job form and filter dropdowns.
export const KARNATAKA_DISTRICTS = [
  'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban',
  'Bidar', 'Chamarajanagar', 'Chikkaballapura', 'Chikkamagaluru', 'Chitradurga',
  'Dakshina Kannada', 'Davanagere', 'Dharwad', 'Gadag', 'Hassan',
  'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal',
  'Mandya', 'Mysuru', 'Raichur', 'Ramanagara', 'Shivamogga',
  'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir', 'Vijayanagara'
];

// ===== SHOW TOAST NOTIFICATION =====
// Displays a popup notification at the bottom-right of the screen.
// type can be: 'success', 'error', 'info' (default: 'info')
// Auto-dismisses after 3 seconds.
export function showToast(message, type = 'info') {
  // Get or create the toast container div.
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  // Choose icon based on type.
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const icon  = icons[type] || 'ℹ️';

  // Create the toast element.
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

  container.appendChild(toast);

  // Automatically remove the toast after 3 seconds.
  setTimeout(() => {
    toast.style.animation = 'toastIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ===== FORMAT DATE =====
// Converts a Firestore Timestamp or JS Date to a readable string.
// Example output: "4 May 2025" or "Today"
export function formatDate(timestamp) {
  if (!timestamp) return '—';

  // Firestore timestamps have a .toDate() method; plain Date objects do not.
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);

  // Check if the date is today.
  const today = new Date();
  const isToday =
    date.getDate()     === today.getDate()    &&
    date.getMonth()    === today.getMonth()   &&
    date.getFullYear() === today.getFullYear();

  if (isToday) return 'Today';

  // Format as "4 May 2025".
  return date.toLocaleDateString('en-IN', {
    day:   'numeric',
    month: 'short',
    year:  'numeric'
  });
}

// ===== TRUNCATE TEXT =====
// Shortens a string to maxLength and adds "…" if it exceeds that length.
// Useful for showing job description previews in cards.
export function truncate(text, maxLength = 80) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '…';
}

// ===== BUILD NAVBAR =====
// Injects the shared navbar into the page. Call with current user data.
// userData: { name, photo } — from Firestore
export function buildNavbar(userData) {
  const navbar = document.getElementById('main-navbar');
  if (!navbar) return;

  navbar.innerHTML = `
    <a class="navbar-brand" href="index.html">
      <div class="logo-icon">🌾</div>
      <div class="logo-text">Kelasa<span>Gaara</span></div>
    </a>
    <div class="navbar-right">
      <div class="nav-user">
        <img src="${userData.photo || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(userData.name)}"
             alt="${userData.name}"
             referrerpolicy="no-referrer" />
        <span>${userData.name.split(' ')[0]}</span>
      </div>
      <button class="btn btn-ghost btn-sm" id="logout-btn" onclick="handleLogout()">
        Logout
      </button>
    </div>
  `;
}

// ===== POPULATE DISTRICT SELECT =====
// Fills a <select> element with all Karnataka districts as options.
export function populateDistricts(selectId, addAllOption = false) {
  const select = document.getElementById(selectId);
  if (!select) return;

  if (addAllOption) {
    select.innerHTML = '<option value="">All Districts</option>';
  } else {
    select.innerHTML = '<option value="" disabled selected>Select District</option>';
  }

  KARNATAKA_DISTRICTS.forEach(district => {
    const option = document.createElement('option');
    option.value       = district;
    option.textContent = district;
    select.appendChild(option);
  });
}

// ===== POPULATE CATEGORIES SELECT =====
// Fills a <select> element with all job categories as options.
export function populateCategories(selectId, addAllOption = false) {
  const select = document.getElementById(selectId);
  if (!select) return;

  const categories = Object.keys(CATEGORY_EMOJI);

  if (addAllOption) {
    select.innerHTML = '<option value="">All Categories</option>';
  } else {
    select.innerHTML = '<option value="" disabled selected>Select Category</option>';
  }

  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value       = cat;
    option.textContent = `${CATEGORY_EMOJI[cat]} ${cat}`;
    select.appendChild(option);
  });
}
