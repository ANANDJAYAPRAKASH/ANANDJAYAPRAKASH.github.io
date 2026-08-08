/* Web Audio UI sound helper */
let audioCtx;
function getAudioContext() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  return audioCtx;
}
function tone(freq, duration = 0.05, type = 'sine', volume = 0.1, delay = 0) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), ctx.currentTime + delay + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration + 0.02);
  } catch (e) {}
}

const $ = (s, p=document) => p.querySelector(s);
const $$ = (s, p=document) => [...p.querySelectorAll(s)];

const header = $('.site-header');
const glow = $('.cursor-glow');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 24);
  const sections = $$('main section[id]');
  const links = $$('.nav-link');
  let current = 'top';
  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 180) current = section.id;
  });
  links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
}, {passive:true});

window.addEventListener('pointermove', e => {
  glow.style.left = `${e.clientX}px`;
  glow.style.top = `${e.clientY}px`;
});

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, {threshold:.12});
$$('.reveal').forEach(el => observer.observe(el));

const menu = $('.menu-btn');
const nav = $('.nav');
menu?.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') === 'true';
  menu.setAttribute('aria-expanded', String(!open));
  nav.classList.toggle('mobile-open', !open);
});

nav?.addEventListener('click', e => {
  if (e.target.matches('.nav-link')) {
    nav.classList.remove('mobile-open');
    menu?.setAttribute('aria-expanded','false');
  }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    nav?.classList.remove('mobile-open');
    menu?.setAttribute('aria-expanded','false');
  }
});

$('#year').textContent = new Date().getFullYear();


/* Ambient UI sound system
   No external audio files required: sounds are synthesized with Web Audio API.
   Browser autoplay rules mean audio starts only after the visitor interacts once. */
(() => {
  let ctx = null;
  let master = null;
  let enabled = true;

  const initAudio = () => {
    if (ctx) return;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.115;
    master.connect(ctx.destination);
  };

  const resume = () => {
    initAudio();
    if (ctx.state === 'suspended') ctx.resume();
  };

  const tone = (freq, duration=.06, type='sine', volume=.12, delay=0) => {
    if (!enabled) return;
    resume();
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(Math.max(volume, .001), now + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    osc.connect(gain).connect(master);
    osc.start(now);
    osc.stop(now + duration + .02);
  };

  const clickSound = () => {
    tone(520, .045, 'square', .15);
    tone(760, .055, 'sine', .095, .025);
  };

  const hoverSound = () => tone(360, .04, 'sine', .09);

  const successSound = () => {
    tone(440, .07, 'sine', .16);
    tone(660, .09, 'sine', .13, .07);
    tone(880, .14, 'sine', .10, .15);
  };

  // Unlock audio on the first intentional interaction.
  ['pointerdown', 'keydown', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, () => { if (!ctx) initAudio(); }, {once:true, passive:true});
  });

  // Navigation / CTA interaction sounds.
  document.addEventListener('click', e => {
    const target = e.target.closest('a, button');
    if (!target) return;
    clickSound();
    if (target.classList.contains('btn-primary')) successSound();
  });

  // Subtle hover cues only for desktop pointers.
  document.addEventListener('pointerover', e => {
    const target = e.target.closest('.work-card, .credential, .insight-card, .skill-chip, .nav-link');
    if (target) hoverSound();
  }, {passive:true});

  // Ambient "radar ping" every 8 seconds while the hero is visible.
  let heroVisible = true;
  const hero = document.querySelector('.hero');
  if (hero) {
    const observer = new IntersectionObserver(entries => {
      heroVisible = entries[0].isIntersecting;
    }, {threshold:.05});
    observer.observe(hero);
  }
  setInterval(() => {
    if (heroVisible && document.visibilityState === 'visible' && enabled) {
      tone(980, .055, 'sine', .07);
      tone(1250, .08, 'sine', .055, .045);
    }
  }, 8000);

  // Sound toggle — deliberately small and unobtrusive.
  const toggle = document.createElement('button');
  toggle.className = 'sound-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-label', 'Toggle interface sounds');
  toggle.innerHTML = '<span class="sound-bars"><i></i><i></i><i></i></span><b>SOUND</b>';
  document.body.appendChild(toggle);

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    enabled = !enabled;
    toggle.classList.toggle('muted', !enabled);
    toggle.setAttribute('aria-pressed', String(enabled));
    if (enabled) successSound();
  });
})();



/* Original cinematic ambient background music + audible navigation feedback */
(() => {
  const audio = new Audio('./assets/audio/cyber-cinematic-original.mp3');
  audio.loop = true;
  audio.volume = 0.24;
  audio.preload = 'auto';

  const startMusic = () => {
    audio.play().catch(() => {});
    window.removeEventListener('pointerdown', startMusic);
    window.removeEventListener('keydown', startMusic);
    window.removeEventListener('touchstart', startMusic);
  };

  window.addEventListener('pointerdown', startMusic, {passive:true});
  window.addEventListener('keydown', startMusic, {passive:true});
  window.addEventListener('touchstart', startMusic, {passive:true});

  const soundButton = document.querySelector('.sound-toggle');
  if (soundButton) {
    soundButton.addEventListener('click', () => {
      if (soundButton.classList.contains('muted')) {
        audio.pause();
      } else {
        audio.play().catch(() => {});
      }
    }, true);
  }

  // Audible scroll ticks, throttled to avoid an annoying rapid-fire effect.
  let lastScrollY = window.scrollY;
  let lastScrollSound = 0;
  let scrollDistance = 0;

  window.addEventListener('scroll', () => {
    const now = performance.now();
    const delta = Math.abs(window.scrollY - lastScrollY);
    scrollDistance += delta;
    lastScrollY = window.scrollY;

    if (scrollDistance >= 240 && now - lastScrollSound > 180) {
      scrollDistance = 0;
      lastScrollSound = now;
      tone(185, .055, 'triangle', .12);
      tone(310, .045, 'sine', .065, .025);
    }

    audio.volume = 0.27;
    clearTimeout(window.__musicScrollTimer);
    window.__musicScrollTimer = setTimeout(() => { audio.volume = 0.24; }, 450);
  }, {passive:true});
})();

// ==========================================
// PORTFOLIO VISITOR TRACKING
// ==========================================

(function trackPortfolioVisit() {
  const VISITOR_API =
    "https://anand-jayaprakash.anandjayaprakash00.workers.dev/api/visit";

  // One notification per browser session
  if (sessionStorage.getItem("portfolio_visit_tracked")) {
    return;
  }

  const payload = {
    page: window.location.pathname,
    referrer: document.referrer || "Direct",
    device: /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
      ? "Mobile"
      : "Desktop",
    browser: navigator.userAgent
  };

  fetch(VISITOR_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload),
    keepalive: true
  })
    .then(response => response.json())
    .then(result => {
      console.log("Visitor tracking:", result);

      if (result.success) {
        sessionStorage.setItem(
          "portfolio_visit_tracked",
          "true"
        );
      }
    })
    .catch(error => {
      console.error(
        "Visitor tracking failed:",
        error
      );
    });
})();

// ==========================================
// DARK / LIGHT MODE
// ==========================================

(function initThemeToggle() {
  const themeToggle = document.getElementById("themeToggle");

  if (!themeToggle) {
    return;
  }

  const themeIcon = themeToggle.querySelector(".theme-icon");
  const themeLabel = themeToggle.querySelector(".theme-label");

  function getPreferredTheme() {
    const savedTheme = localStorage.getItem("portfolio-theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }

    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches
      ? "light"
      : "dark";
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);

    if (theme === "light") {
      themeIcon.textContent = "☀";
      themeLabel.textContent = "LIGHT";

      themeToggle.setAttribute(
        "aria-label",
        "Switch to dark mode"
      );
    } else {
      themeIcon.textContent = "☾";
      themeLabel.textContent = "DARK";

      themeToggle.setAttribute(
        "aria-label",
        "Switch to light mode"
      );
    }

    localStorage.setItem("portfolio-theme", theme);

    // Update browser address-bar/theme color
    const themeColor = document.querySelector(
      'meta[name="theme-color"]'
    );

    if (themeColor) {
      themeColor.setAttribute(
        "content",
        theme === "light"
          ? "#f4f8f6"
          : "#07110f"
      );
    }
  }

  const initialTheme = getPreferredTheme();

  applyTheme(initialTheme);

  themeToggle.addEventListener("click", function () {
    const currentTheme =
      document.documentElement.getAttribute("data-theme");

    const newTheme =
      currentTheme === "dark"
        ? "light"
        : "dark";

    applyTheme(newTheme);
  });
})();