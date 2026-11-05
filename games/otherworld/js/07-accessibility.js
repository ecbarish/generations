'use strict';
/* Reading windows stay within the world; no story or save rules change. */
document.addEventListener('keydown', e => {
  if (e.target && e.target.closest && e.target.closest('.arc-set-bg')) return;
  const status = document.getElementById('status'), choose = panel(), ledger = document.getElementById('ledger');
  if (!status.hidden && e.key === 'Escape' && (!ledger || ledger.hidden)) { e.preventDefault(); e.stopImmediatePropagation(); status.hidden = true; if (typeof syncReading === 'function') syncReading(); if (sceneState) D.el.focus(); else document.getElementById('statusBtn').focus(); return; }
  if (!status.hidden && !status.contains(document.activeElement) && e.key === 'Tab') { e.preventDefault(); e.stopImmediatePropagation(); status.querySelector('button')?.focus(); return; }
  if (!status.hidden && status.contains(document.activeElement)) { Settings.trapTab(e, status); e.stopImmediatePropagation(); return; }
  if (!choose.hidden) Settings.trapTab(e, choose);
}, true);
