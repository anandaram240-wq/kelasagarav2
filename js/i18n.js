// KelasaGaara — i18n engine (English ↔ Kannada)
const I18N = {
  en: {
    // Nav
    "nav.home": "Home", "nav.jobs": "Jobs", "nav.worker": "Worker",
    "nav.hirer": "Hirer", "nav.admin": "Admin", "nav.login": "Login", "nav.signup": "Sign Up",
    // Hero
    "hero.title": "Find Skilled Workers", "hero.sub": "Find Skilled Workers Near You",
    "hero.desc": "Painters, Plumbers, Electricians, Masons & 40+ trades across all 31 Karnataka districts — 0% commission.",
    // Stats
    "stat.workers": "Workers", "stat.districts": "Districts",
    "stat.jobs": "Jobs Posted", "stat.commission": "Commission",
    // Filter
    "filter.districts": "All Districts", "filter.taluks": "All Taluks",
    "filter.ph": "Search name, trade...", "filter.btn": "Search",
    // Sort
    "sort.by": "Sort by:", "sort.rating": "Rating",
    "sort.pu": "Price ↑", "sort.pd": "Price ↓", "sort.exp": "Experience",
    // Categories
    "cat.all": "All", "cat.painter": "Painter", "cat.plumber": "Plumber",
    "cat.elec": "Electrician", "cat.mason": "Mason", "cat.carp": "Carpenter",
    "cat.driver": "Driver", "cat.cook": "Cook", "cat.garden": "Gardener",
    "cat.sec": "Security", "cat.help": "Helper",
    // Cards
    "card.msg": "💬 Message", "card.book": "📅 Book Now",
    // Footer
    "footer": "Karnataka Daily Worker Marketplace"
  },
  kn: {
    // Nav
    "nav.home": "ಮನೆ", "nav.jobs": "ಕೆಲಸಗಳು", "nav.worker": "ಕೆಲಸಗಾರ",
    "nav.hirer": "ನೇಮಕದಾರ", "nav.admin": "ನಿರ್ವಾಹಕ", "nav.login": "ಲಾಗಿನ್", "nav.signup": "ನೋಂದಣಿ",
    // Hero
    "hero.title": "ನಿಪುಣ ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕಿ", "hero.sub": "ಹತ್ತಿರದ ಕೆಲಸಗಾರರನ್ನು ಹುಡುಕಿ",
    "hero.desc": "ಪೇಂಟರ್, ಪ್ಲಂಬರ್, ಎಲೆಕ್ಟ್ರಿಷಿಯನ್, ಮೇಸ್ತ್ರಿ ಮತ್ತು 40+ ವೃತ್ತಿಗಳು — 31 ಜಿಲ್ಲೆಗಳಲ್ಲಿ — 0% ಕಮಿಷನ್.",
    // Stats
    "stat.workers": "ಕೆಲಸಗಾರರು", "stat.districts": "ಜಿಲ್ಲೆಗಳು",
    "stat.jobs": "ಪೋಸ್ಟ್ ಉದ್ಯೋಗ", "stat.commission": "ಕಮಿಷನ್",
    // Filter
    "filter.districts": "ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳು", "filter.taluks": "ಎಲ್ಲಾ ತಾಲೂಕುಗಳು",
    "filter.ph": "ಹೆಸರು, ವೃತ್ತಿ ಹುಡುಕಿ...", "filter.btn": "ಹುಡುಕಿ",
    // Sort
    "sort.by": "ವಿಂಗಡಿಸಿ:", "sort.rating": "ರೇಟಿಂಗ್",
    "sort.pu": "ಬೆಲೆ ↑", "sort.pd": "ಬೆಲೆ ↓", "sort.exp": "ಅನುಭವ",
    // Categories
    "cat.all": "ಎಲ್ಲಾ", "cat.painter": "ಪೇಂಟರ್", "cat.plumber": "ಪ್ಲಂಬರ್",
    "cat.elec": "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್", "cat.mason": "ಮೇಸ್ತ್ರಿ", "cat.carp": "ಮರಗೆಲಸ",
    "cat.driver": "ಡ್ರೈವರ್", "cat.cook": "ಅಡಿಗೆ", "cat.garden": "ತೋಟಗಾರ",
    "cat.sec": "ಸೆಕ್ಯೂರಿಟಿ", "cat.help": "ಸಹಾಯಕ",
    // Cards
    "card.msg": "💬 ಸಂದೇಶ", "card.book": "📅 ಈಗ ಬುಕ್",
    // Footer
    "footer": "ಕರ್ನಾಟಕ ದೈನಂದಿನ ಕೆಲಸಗಾರ ಮಾರುಕಟ್ಟೆ"
  }
};

function applyLang(lang) {
  localStorage.setItem('kelasa_lang', lang);
  const t = I18N[lang];
  // Text elements
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.getAttribute('data-i18n');
    if (t[k] !== undefined) el.innerHTML = t[k];
  });
  // Placeholders
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const k = el.getAttribute('data-i18n-ph');
    if (t[k] !== undefined) el.placeholder = t[k];
  });
  // Select first option text
  document.querySelectorAll('[data-i18n-opt]').forEach(el => {
    const k = el.getAttribute('data-i18n-opt');
    if (t[k] !== undefined && el.options[0]) el.options[0].text = t[k];
  });
  // Highlight active button
  ['btn-lang-en','btn-lang-kn'].forEach(id => {
    const b = document.getElementById(id);
    if (!b) return;
    const active = (id === 'btn-lang-en' && lang === 'en') || (id === 'btn-lang-kn' && lang === 'kn');
    b.style.background = active ? '#E25519' : 'transparent';
    b.style.color      = active ? '#fff'    : '#E25519';
    b.style.fontWeight = active ? '800'     : '600';
  });
}

function initLang() {
  const lang = localStorage.getItem('kelasa_lang') || 'en';
  applyLang(lang);
}

export { applyLang, initLang, I18N };
