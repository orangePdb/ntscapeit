/**
 * NETSCAPEIT.ORG — OFFICIAL PORTAL JAVASCRIPT
 * Authentic 1998–2003 UI behaviors, screenshot modal, download switcher, and FAQ accordion.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initFaqAccordion();
  initScreenshots();
  initDownloadModal();
  initCopyButtons();
  initRetroSound();
});

/* Tab Switching (Homepage Tabs & Subsections) */
function initTabs() {
  const tabLinks = document.querySelectorAll('[data-tab-target]');
  tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('data-tab-target');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        // Update active class on links
        tabLinks.forEach(l => l.parentElement && l.parentElement.classList.remove('active'));
        if (link.parentElement) link.parentElement.classList.add('active');
      }
    });
  });
}

/* FAQ Accordion */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const q = item.querySelector('.faq-question');
    const a = item.querySelector('.faq-answer');
    if (!q || !a) return;

    q.addEventListener('click', () => {
      const isVisible = a.style.display === 'block';
      // Close all
      document.querySelectorAll('.faq-answer').forEach(ans => ans.style.display = 'none');
      document.querySelectorAll('.faq-question .indicator').forEach(ind => ind.textContent = '[+]');

      if (!isVisible) {
        a.style.display = 'block';
        const ind = q.querySelector('.indicator');
        if (ind) ind.textContent = '[-]';
      }
    });
  });
}

/* Screenshot Modal Viewer */
function initScreenshots() {
  const modal = document.getElementById('screenshotModal');
  const modalImg = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalDesc = document.getElementById('modalDescription');
  const closeBtn = document.getElementById('closeModalBtn');

  if (!modal) return;

  const triggers = document.querySelectorAll('[data-screenshot-src]');
  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const src = trigger.getAttribute('data-screenshot-src');
      const title = trigger.getAttribute('data-screenshot-title') || 'Netscapeit Screenshot';
      const desc = trigger.getAttribute('data-screenshot-desc') || '';

      if (modalImg) modalImg.src = src;
      if (modalTitle) modalTitle.textContent = title;
      if (modalDesc) modalDesc.textContent = desc;

      modal.classList.add('active');
    });
  });

  const closeModal = () => modal.classList.remove('active');

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });
}

/* Download Verification Modal */
function initDownloadModal() {
  const dlModal = document.getElementById('downloadModal');
  const dlTitle = document.getElementById('dlModalTitle');
  const dlBody = document.getElementById('dlModalBody');
  const closeDlBtn = document.getElementById('closeDlModalBtn');

  if (!dlModal) return;

  const dlButtons = document.querySelectorAll('[data-download-os]');
  dlButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const os = btn.getAttribute('data-download-os');
      showDownloadInfo(os);
    });
  });

  function showDownloadInfo(os) {
    if (!dlModal || !dlTitle || !dlBody) return;

    let osName = 'Desktop Binary';
    let details = '';

    if (os === 'windows') {
      osName = 'Microsoft Windows';
      details = `
        <p><b>Target Platform:</b> Windows 98 / 2000 / XP / 10 / 11</p>
        <p><b>Status:</b> Pre-release / Early Development (Native installer in progress).</p>
        <p>You can currently run the full Netscapeit experience in two verified ways:</p>
        <ul>
          <li><b>Option 1 (Instant):</b> Use the live web application at <a href="https://netscp.netscapeit.org" target="_blank">netscp.netscapeit.org</a>.</li>
          <li><b>Option 2 (Local Build):</b> Clone the repository from GitHub and run <code>npm install && npm run dev</code>.</li>
        </ul>
      `;
    } else if (os === 'macos') {
      osName = 'Apple macOS';
      details = `
        <p><b>Target Platform:</b> macOS (Apple Silicon & Intel) / Classic Mac OS aesthetics</p>
        <p><b>Status:</b> Pre-release / Early Development (Native .dmg in progress).</p>
        <p>Recommended access:</p>
        <ul>
          <li><b>Option 1:</b> Instant access via <a href="https://netscp.netscapeit.org" target="_blank">netscp.netscapeit.org</a>.</li>
          <li><b>Option 2:</b> Build locally via Node.js 18+ and Vite.</li>
        </ul>
      `;
    } else if (os === 'linux') {
      osName = 'Linux / X11';
      details = `
        <p><b>Target Platform:</b> Linux (x86_64, ARM64) with X11 / Wayland</p>
        <p><b>Status:</b> Pre-release / Early Development (AppImage / Tarball in progress).</p>
        <p>Recommended access:</p>
        <ul>
          <li><b>Option 1:</b> Launch browser app via <a href="https://netscp.netscapeit.org" target="_blank">netscp.netscapeit.org</a>.</li>
          <li><b>Option 2:</b> Clone the source repository with Git.</li>
        </ul>
      `;
    }

    dlTitle.textContent = `Netscapeit for ${osName} — Distribution Status`;
    dlBody.innerHTML = details;
    dlModal.classList.add('active');
  }

  const closeDlModal = () => dlModal.classList.remove('active');
  if (closeDlBtn) closeDlBtn.addEventListener('click', closeDlModal);
  dlModal.addEventListener('click', (e) => {
    if (e.target === dlModal) closeDlModal();
  });
}

/* Copy to Clipboard with Feedback */
function initCopyButtons() {
  const copyBtns = document.querySelectorAll('[data-copy-target]');
  copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-copy-target');
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;

      const text = targetEl.textContent || targetEl.innerText;
      navigator.clipboard.writeText(text.trim()).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '✓ Copied!';
        setTimeout(() => {
          btn.innerHTML = originalText;
        }, 2000);
      }).catch(err => {
        console.error('Copy failed', err);
      });
    });
  });
}

/* Optional Web Audio 56k Modem Sound Simulator */
function initRetroSound() {
  const soundBtn = document.getElementById('playModemBtn');
  if (!soundBtn) return;

  soundBtn.addEventListener('click', () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.04, now);

      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.setValueAtTime(2400, now + 0.12);
      osc.frequency.setValueAtTime(980, now + 0.25);
      osc.frequency.setValueAtTime(1650, now + 0.4);
      osc.frequency.setValueAtTime(2100, now + 0.55);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.95);

      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.08);

      soundBtn.textContent = '🔊 Connected 56k!';
      setTimeout(() => {
        soundBtn.textContent = '🔊 Test 56k Handshake';
      }, 1500);
    } catch (e) {
      console.warn('Audio not allowed', e);
    }
  });
}
