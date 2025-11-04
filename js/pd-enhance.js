/* Opt-in enhancement module.
   Usage (after I push this file and you load the branch):
   - In the console or a small script on the page:
       PDGenerator.init({ enableAutoHook: false })
   - If enableAutoHook is true, the module will attach listeners to start/stop buttons.
*/
(function(window, document){
  'use strict';

  const DEFAULT_EVENT_NAME_PREFIX = 'pd';

  function createPDEvent(action, detail = {}) {
    return new CustomEvent(`${DEFAULT_EVENT_NAME_PREFIX}:${action}`, {
      detail,
      bubbles: true,
      composed: true
    });
  }

  function safeDispatch(el, ev) {
    try {
      (el || document).dispatchEvent(ev);
    } catch (e) {
      // Fail silently - do not break page functionality
      console.error('PDGenerator: dispatch error', e);
    }
  }

  function attachButtonHooks() {
    const startBtn = document.querySelector('button[onclick="startGenerator()"]');
    const stopBtn = document.querySelector('button[onclick="stopGenerator()"]');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        const ev = createPDEvent('start', { time: Date.now() });
        safeDispatch(document, ev);
      }, { passive: true });
    }
    if (stopBtn) {
      stopBtn.addEventListener('click', () => {
        const ev = createPDEvent('stop', { time: Date.now() });
        safeDispatch(document, ev);
      }, { passive: true });
    }

    // Hook into Add key buttons to announce addition
    document.querySelectorAll('button[onclick^="addKey"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ev = createPDEvent('key:add', { buttonText: btn.textContent.trim() });
        safeDispatch(document, ev);
      }, { passive: true });
    });
  }

  function observeStatusLog() {
    const log = document.getElementById('statusLog');
    if (!log) return;
    const observer = new MutationObserver(mutations => {
      mutations.forEach(m => {
        const ev = createPDEvent('log:update', { addedNodes: m.addedNodes.length, time: Date.now() });
        safeDispatch(document, ev);
      });
    });
    observer.observe(log, { childList: true, subtree: false });
  }

  // Public API
  const PDGenerator = {
    init(options = {}) {
      // Options: { enableAutoHook: boolean } — default false
      const opts = Object.assign({ enableAutoHook: false }, options);

      // Non-destructive augmentation: just attach listeners; do not modify existing functions
      if (opts.enableAutoHook) {
        attachButtonHooks();
      }
      // Always observe the status log to emit log:update events
      observeStatusLog();

      // Provide a convenience method to dispatch "send" events:
      this.dispatchSent = function(meta = {}) {
        const ev = createPDEvent('send', Object.assign({ time: Date.now() }, meta));
        safeDispatch(document, ev);
      };

      return { ok: true };
    }
  };

  // Expose
  if (!window.PDGenerator) {
    window.PDGenerator = PDGenerator;
  }

})(window, document);
