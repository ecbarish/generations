/* ONBOARD-KIT1: optional, storage-free browser guidance. The game owns goals, state and actions. */
(function (global) {
  'use strict';
  function create(options) {
    if (!options || !options.element) throw new TypeError('A guidance element is required.');
    const root = options.element, doc = root.ownerDocument, win = doc.defaultView;
    let model = null, destroyed = false;
    let input = win.matchMedia && win.matchMedia('(pointer: coarse)').matches ? 'touch' : 'keyboard';
    const make = (tag, name) => { const node = doc.createElement(tag); node.className = name; return node; };
    const title = make('h3', 'onboarding-title'), goal = make('p', 'onboarding-goal');
    const text = make('p', 'onboarding-text'), controls = make('p', 'onboarding-input');
    const orientation = make('p', 'onboarding-orientation'), actions = make('div', 'onboarding-actions');
    const dismiss = make('button', 'onboarding-dismiss'); dismiss.type = 'button'; dismiss.dataset.onboardingDismiss = '';
    root.classList.add('arc-onboarding');
    root.replaceChildren(title, goal, text, controls, orientation, actions, dismiss);
    root.hidden = true;
    const actionButtons = new Map();
    function line(node, value) { const content = value || ''; if (node.textContent !== content) node.textContent = content; node.hidden = !value; }
    function environment() {
      if (destroyed || !model) return;
      root.dataset.input = input;
      line(controls, model.inputs && model.inputs[input]);
      const portrait = win.innerHeight > win.innerWidth;
      line(orientation, input === 'touch' && model.orientation && model.orientation[portrait ? 'portrait' : 'landscape']);
    }
    function setInput(next) {
      if (destroyed || input === next) return;
      input = next; environment();
      if (typeof options.onInputChange === 'function') options.onInputChange(input);
    }
    function pointer(event) { setInput(event.pointerType === 'touch' || event.pointerType === 'pen' ? 'touch' : 'keyboard'); }
    function keyboard(event) { if (!event.metaKey && !event.ctrlKey && !event.altKey) setInput('keyboard'); }
    function activate(event) {
      const button = event.target.closest('button');
      if (!model || !button || !root.contains(button)) return;
      if (button === dismiss) { if (typeof options.onDismiss === 'function') options.onDismiss(model.id); }
      else if (button.dataset.onboardingAction && typeof options.onAction === 'function') options.onAction(button.dataset.onboardingAction, model.id);
    }
    win.addEventListener('pointerdown', pointer, true);
    win.addEventListener('keydown', keyboard, true);
    win.addEventListener('resize', environment);
    root.addEventListener('click', activate);
    return {
      update(next) {
        if (destroyed) return;
        model = next || null; root.hidden = !model;
        if (!model) return;
        line(title, model.title); line(goal, model.goal); line(text, model.text);
        const wanted = new Set(); let actionIndex = 0;
        for (const action of model.actions || []) {
          if (!action || !action.id || wanted.has(action.id)) continue;
          wanted.add(action.id);
          let button = actionButtons.get(action.id);
          if (!button) { button = make('button', 'onboarding-action'); button.type = 'button'; button.dataset.onboardingAction = action.id; actionButtons.set(action.id, button); actions.append(button); }
          line(button, action.label);
          if (actions.children[actionIndex] !== button) actions.insertBefore(button, actions.children[actionIndex] || null);
          actionIndex++;
        }
        for (const [id, button] of actionButtons) if (!wanted.has(id)) { button.remove(); actionButtons.delete(id); }
        actions.hidden = !wanted.size;
        line(dismiss, model.dismissLabel === undefined ? 'Got it' : model.dismissLabel);
        environment();
      },
      getInputMode() { return input; },
      destroy() {
        if (destroyed) return;
        destroyed = true; model = null;
        win.removeEventListener('pointerdown', pointer, true); win.removeEventListener('keydown', keyboard, true);
        win.removeEventListener('resize', environment); root.removeEventListener('click', activate);
        root.hidden = true; root.replaceChildren(); root.classList.remove('arc-onboarding'); delete root.dataset.input;
      }
    };
  }
  global.ArcadeOnboarding = Object.freeze({ create });
})(window);
