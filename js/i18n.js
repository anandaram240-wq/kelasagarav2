// KelasaGaara — Kannada/English translation engine
const TRANSLATIONS = {
  en: {
    "nav.home":"Home","nav.jobs":"Jobs","nav.worker":"Worker","nav.hirer":"Hirer","nav.admin":"Admin","nav.login":"Login","nav.signup":"Sign Up",
    "hero.title":"Find Skilled Workers","hero.subtitle":"Find Skilled Workers Near You","hero.desc":"Painters, Plumbers, Electricians, Masons & 40+ trades across all 31 Karnataka districts — 0% commission.",
    "stat.workers":"Workers","stat.districts":"Districts","stat.jobs":"Jobs Posted","stat.commission":"Commission",
    "filter.districts":"All Districts","filter.taluks":"All Taluks","filter.search":"Search name, trade...","filter.btn":"Search",
    "sort.label":"Sort by:","sort.rating":"Rating","sort.priceu":"Price ↑","sort.priced":"Price ↓","sort.exp":"Experience",
    "cat.all":"All","cat.painter":"Painter","cat.plumber":"Plumber","cat.electrician":"Electrician","cat.mason":"Mason","cat.carpenter":"Carpenter","cat.driver":"Driver","cat.cook":"Cook","cat.gardener":"Gardener","cat.security":"Security","cat.helper":"Helper",
    "card.msg":"Message","card.book":"Book Now",
    "empty.noworkers":"No workers found.","empty.register":"Register as a Worker",
    "footer.tagline":"Karnataka Daily Worker Marketplace"
  },
  kn: {
    "nav.home":"ಮುಖಪುಟ","nav.jobs":"ಉದ್ಯೋಗ","nav.worker":"ಕೆಲಸಗಾರ","nav.hirer":"ನೇಮಕದಾರ","nav.admin":"ಆಡಳಿತ","nav.login":"ಲಾಗಿನ್","nav.signup":"ನೋಂದಣಿ",
    "hero.title":"ನಿಪುಣ ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕಿ","hero.subtitle":"ಹತ್ತಿರದ ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕಿ","hero.desc":"ಪೇಂಟರ್, ಪ್ಲಂಬರ್, ಎಲೆಕ್ಟ್ರಿಷಿಯನ್, ಮೇಸ್ತ್ರಿ ಮತ್ತು 40+ ವೃತ್ತಿಗಳು — 31 ಕರ್ನಾಟಕ ಜಿಲ್ಲೆಗಳಲ್ಲಿ — 0% ಕಮಿಷನ್.",
    "stat.workers":"ಕೆಲಸಗಾರರು","stat.districts":"ಜಿಲ್ಲೆಗಳು","stat.jobs":"ಪೋಸ್ಟ್ ಉದ್ಯೋಗ","stat.commission":"ಕಮಿಷನ್",
    "filter.districts":"ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳು","filter.taluks":"ಎಲ್ಲಾ ತಾಲ್ಲೂಕು","filter.search":"ಹೆಸರು, ವ್ಯಾಪಾರ ಹುಡುಕಿ...","filter.btn":"ಹುಡುಕಿ",
    "sort.label":"ವಿಂಗಡಿಸಿ:","sort.rating":"ರೇಟಿಂಗ್","sort.priceu":"ಬೆಲೆ ↑","sort.priced":"ಬೆಲೆ ↓","sort.exp":"ಅನುಭವ",
    "cat.all":"ಎಲ್ಲಾ","cat.painter":"ಪೇಂಟರ್","cat.plumber":"ಪ್ಲಂಬರ್","cat.electrician":"ಎಲೆಕ್ಟ್ರಿಷಿಯನ್","cat.mason":"ಮೇಸ್ತ್ರಿ","cat.carpenter":"ಮರಗೆಲಸ","cat.driver":"ಡ್ರೈವರ್","cat.cook":"ಅಡಿಗೆ","cat.gardener":"ತೋಟಗಾರ","cat.security":"ಸೆಕ್ಯೂರಿಟಿ","cat.helper":"ಸಹಾಯಕ",
    "card.msg":"ಸಂದೇಶ","card.book":"ಈಗ ಬುಕ್",
    "empty.noworkers":"ಯಾವುದೇ ಕೆಲಸಗಾರರು ಕಂಡುಬಂದಿಲ್ಲ.","empty.register":"ಕೆಲಸಗಾರರಾಗಿ ನೋಂದಾಯಿಸಿ",
    "footer.tagline":"ಕರ್ನಾಟಕ ದೈನಂದಿನ ಕೆಲಸ ಮಾರುಕಟ್ಟೆ"
  }
};

let currentLang = localStorage.getItem('kelasa_lang') || 'en';

function applyLang(lang) {
  currentLang = lang;
  localStorage.setItem('kelasa_lang', lang);
  const t = TRANSLATIONS[lang];
  // Update all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (t[key]) el.textContent = t[key];
  });
  // Update placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const key = el.getAttribute('data-i18n-ph');
    if (t[key]) el.placeholder = t[key];
  });
  // Update select first options
  document.querySelectorAll('[data-i18n-opt]').forEach(el => {
    const key = el.getAttribute('data-i18n-opt');
    if (t[key] && el.options[0]) el.options[0].text = t[key];
  });
  // Toggle button label
  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = lang === 'en' ? 'ಕನ್ನಡ' : 'English';
}

function toggleLang() {
  applyLang(currentLang === 'en' ? 'kn' : 'en');
}

// Auto-apply on load
document.addEventListener('DOMContentLoaded', () => applyLang(currentLang));

export { applyLang, toggleLang, currentLang, TRANSLATIONS };
