// Run the unchanged repository suites without audible OS text-to-speech.
// Limited to browsers launched by this process; never changes a user's browser or game.
const path = require('path');
const { chromium } = require('playwright');
const launch = chromium.launch.bind(chromium);
chromium.launch = async function(options = {}) {
  const browser = await launch({ ...options, args: [...(options.args || []), '--mute-audio'] });
  const newContext = browser.newContext.bind(browser);
  browser.newContext = async function(...args) {
    const context = await newContext(...args);
    await context.addInitScript(() => {
      // Also runs before nested game iframes. Little Ranch's own word/setting
      // assertions still run; only the native audible sink is replaced.
      const speech = window.speechSynthesis;
      if (speech) {
        speech.cancel();
        Object.defineProperty(speech, 'speak', { configurable: true, value: () => {} });
      }
    });
    return context;
  };
  return browser;
};
require(path.resolve(__dirname, '../../../tools/run-all-checks.cjs'));
