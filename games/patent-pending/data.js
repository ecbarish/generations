/* Patent Pending content. Numbers follow Penny Loop's ladder.
   Names, blurbs and the docket are original. No page, no storage. */
(function () {
  'use strict';

  function svg(body) {
    return '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">' + body + '</svg>';
  }
  var ink = '#1c2430';
  var seal = '#9c2f2f';
  var brass = '#8a6a32';

  var INVENTIONS = [
    { id: 'clip', name: 'Better Paperclip', blurb: 'It holds the stack and still lets one page go.', clerk: 'Clerk Pip', base: 0.05, growth: 1.07, revenue: 0.01, cycle: 0.5,
      icon: svg('<path d="M8 7a4 4 0 0 1 8 0v8a2.5 2.5 0 0 1-5 0V8" fill="none" stroke="' + ink + '" stroke-width="2" stroke-linecap="round"/>') },
    { id: 'spoon', name: 'Self-stirring Spoon', blurb: 'The spoon keeps the cocoa moving while you stamp.', clerk: 'Inventor Nib', base: 1, growth: 1.15, revenue: 0.55, cycle: 3,
      icon: svg('<path d="M12 3c2 3 2 5 0 7-2 2-2 4 0 11" fill="none" stroke="' + brass + '" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="6" r="2.2" fill="' + seal + '"/>') },
    { id: 'brolly', name: 'Pocket Umbrella', blurb: 'It opens inside a coat and somehow stays dry.', clerk: 'Clerk Brolly', base: 12, growth: 1.14, revenue: 4.5, cycle: 6,
      icon: svg('<path d="M4 10c2-5 14-5 16 0" fill="none" stroke="' + seal + '" stroke-width="2"/><path d="M12 10v9" stroke="' + ink + '" stroke-width="2" stroke-linecap="round"/>') },
    { id: 'bell', name: 'Quiet Doorbell', blurb: 'It rings in a colour, for houses that hate noise.', clerk: 'Inventor Hush', base: 140, growth: 1.13, revenue: 34, cycle: 12,
      icon: svg('<path d="M6 14a6 6 0 0 1 12 0" fill="none" stroke="' + brass + '" stroke-width="2"/><rect x="10" y="14" width="4" height="3" rx="1" fill="' + ink + '"/>') },
    { id: 'ladder', name: 'Folding Stepladder', blurb: 'Three steps, and it hides behind a door.', clerk: 'Clerk Rung', base: 1600, growth: 1.12, revenue: 260, cycle: 24,
      icon: svg('<path d="M7 20l4-16M17 20l-4-16M8 10h8M9 14h6" fill="none" stroke="' + ink + '" stroke-width="2" stroke-linecap="round"/>') },
    { id: 'crank', name: 'Window Crank', blurb: 'One turn, and the stiff sash gives up.', clerk: 'Inventor Sash', base: 1.8e4, growth: 1.11, revenue: 1900, cycle: 48,
      icon: svg('<circle cx="12" cy="12" r="4" fill="none" stroke="' + brass + '" stroke-width="2"/><path d="M12 8V3M16 12h5" stroke="' + ink + '" stroke-width="2" stroke-linecap="round"/>') },
    { id: 'glider', name: 'Parcel Glider', blurb: 'A paper wing that lands on the right porch.', clerk: 'Clerk Glide', base: 2.2e5, growth: 1.1, revenue: 1.5e4, cycle: 96,
      icon: svg('<path d="M3 14l18-5-8 2 2 8-3-6z" fill="' + seal + '"/>') },
    { id: 'tram', name: 'Clockwork Tram', blurb: 'It climbs the high street on a spring and a bell.', clerk: 'Inventor Cog', base: 2.6e6, growth: 1.09, revenue: 1.15e5, cycle: 192,
      icon: svg('<rect x="4" y="8" width="16" height="8" rx="2" fill="none" stroke="' + ink + '" stroke-width="2"/><circle cx="8" cy="18" r="2" fill="' + brass + '"/><circle cx="16" cy="18" r="2" fill="' + brass + '"/>') },
    { id: 'kite', name: 'Weather Kite', blurb: 'It writes the afternoon wind where the town can see it.', clerk: 'Clerk Gale', base: 3.2e7, growth: 1.08, revenue: 9.2e5, cycle: 384,
      icon: svg('<path d="M12 3l7 9-7 9-7-9z" fill="none" stroke="' + seal + '" stroke-width="2"/><path d="M12 12v9" stroke="' + ink + '" stroke-width="2"/>') },
    { id: 'lens', name: 'Lighthouse Lens', blurb: 'One glass, and the harbour finds its own light.', clerk: 'Inventor Lens', base: 4e8, growth: 1.07, revenue: 7.6e6, cycle: 768,
      icon: svg('<circle cx="12" cy="12" r="5" fill="none" stroke="' + brass + '" stroke-width="2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="' + seal + '" stroke-width="2" stroke-linecap="round"/>') },
    { id: 'tide', name: 'Tide Clock', blurb: 'It knows the marsh before the boats do.', clerk: 'Clerk Tide', base: 5e9, growth: 1.06, revenue: 6.6e7, cycle: 1536,
      icon: svg('<circle cx="12" cy="12" r="7" fill="none" stroke="' + ink + '" stroke-width="2"/><path d="M12 12l3-4" stroke="' + seal + '" stroke-width="2" stroke-linecap="round"/>') },
    { id: 'signal', name: 'Signal Kite', blurb: 'A message on a string, for hills with no wire.', clerk: 'Inventor Thread', base: 6e10, growth: 1.05, revenue: 5.6e8, cycle: 3072,
      icon: svg('<path d="M5 19l7-15 7 15" fill="none" stroke="' + brass + '" stroke-width="2"/><path d="M8 14h8" stroke="' + seal + '" stroke-width="2"/>') },
    { id: 'sky', name: 'Sky-ship', blurb: 'A small hull that prefers air to water.', clerk: 'Clerk Hull', base: 7.2e11, growth: 1.048, revenue: 2.95e9, cycle: 4096,
      icon: svg('<path d="M3 15h14l4-4H9z" fill="' + seal + '"/><path d="M8 15v3h6" fill="none" stroke="' + ink + '" stroke-width="2"/>') },
    { id: 'frost', name: 'Frost Lamp', blurb: 'It keeps a path lit without eating the night.', clerk: 'Inventor Wick', base: 8.6e12, growth: 1.046, revenue: 1.47e10, cycle: 5120,
      icon: svg('<rect x="9" y="8" width="6" height="8" rx="3" fill="' + brass + '"/><path d="M12 4v3M8 18h8" stroke="' + ink + '" stroke-width="2" stroke-linecap="round"/>') },
    { id: 'well', name: 'Echo Well', blurb: 'Speak once, and the well repeats the useful part.', clerk: 'Clerk Echo', base: 1.04e14, growth: 1.044, revenue: 7.08e10, cycle: 6144,
      icon: svg('<ellipse cx="12" cy="8" rx="6" ry="3" fill="none" stroke="' + ink + '" stroke-width="2"/><path d="M6 8v8c0 2 12 2 12 0V8" fill="none" stroke="' + brass + '" stroke-width="2"/>') },
    { id: 'orchard', name: 'Gear Orchard', blurb: 'The trees grow spare cogs when the season turns.', clerk: 'Inventor Orchard', base: 1.24e15, growth: 1.042, revenue: 2.83e11, cycle: 6144,
      icon: svg('<circle cx="12" cy="13" r="3" fill="none" stroke="' + brass + '" stroke-width="2"/><path d="M12 5v3M12 18v2M5 13h3M16 13h3" stroke="' + seal + '" stroke-width="2" stroke-linecap="round"/>') },
    { id: 'loom', name: 'Horizon Loom', blurb: 'It weaves a sail from the colour of the sky.', clerk: 'Clerk Loom', base: 1.49e16, growth: 1.04, revenue: 1.33e12, cycle: 7200,
      icon: svg('<path d="M5 5h14v14H5z" fill="none" stroke="' + ink + '" stroke-width="2"/><path d="M5 9h14M5 14h14M9 5v14M14 5v14" stroke="' + brass + '" stroke-width="1.4"/>') },
    { id: 'press', name: 'Century Press', blurb: 'A press that dates an idea for a hundred years.', clerk: 'Inventor Seal', base: 1.79e17, growth: 1.038, revenue: 5.31e12, cycle: 7200,
      icon: svg('<rect x="6" y="4" width="12" height="6" fill="' + seal + '"/><rect x="8" y="12" width="8" height="8" fill="none" stroke="' + ink + '" stroke-width="2"/>') }
  ];

  var TIERS = ['A small change', 'A better change', 'A lasting change'];
  var TIER_MATH = [[220, 3], [2600, 3], [26000, 4]];
  var UPGRADES = [];
  INVENTIONS.forEach(function (v, i) {
    TIER_MATH.forEach(function (pair, k) {
      UPGRADES.push({
        id: 'v' + i + '_' + k,
        kind: 'v',
        invention: i,
        factor: pair[1],
        cost: v.base * pair[0],
        name: TIERS[k] + ' for the ' + v.name,
        note: 'The ' + v.name + ' files ' + pair[1] + ' times as much.'
      });
    });
  });
  var BUREAU = ['A second inkwell', 'A clerk\'s lamp', 'A wider blotter', 'A second press', 'A quiet hour', 'A full cabinet', 'A brass date stamp', 'The grand seal'];
  [[1, 60, 2], [2, 4200, 2], [3, 3.1e5, 2], [4, 2.4e7, 2], [5, 1.9e9, 2], [6, 1.5e11, 2], [7, 1.2e13, 2], [8, 9.5e14, 2]].forEach(function (row, n) {
    UPGRADES.push({
      id: 'g' + row[0], kind: 'g', factor: row[2], cost: row[1],
      name: BUREAU[n],
      note: 'Every invention files ' + row[2] + ' times as much.'
    });
  });
  var STAMPS = ['A quicker wrist', 'A second pad', 'Ink that bites', 'A standing desk', 'Both hands', 'The rhythm'];
  [[1, 25, 3], [2, 1800, 3], [3, 1.4e5, 4], [4, 1.1e7, 5], [5, 8e8, 5], [6, 6e10, 5]].forEach(function (row, n) {
    UPGRADES.push({
      id: 't' + row[0], kind: 't', factor: row[2], cost: row[1],
      name: STAMPS[n],
      note: 'Stamping by hand pays ' + row[2] + ' times as much, and a combo boost grows a little.'
    });
  });
  [[1, 5e4, 4, 'four more hours'], [2, 3e7, 4, 'four more hours again'], [3, 2e10, 12, 'twelve more hours']].forEach(function (row) {
    UPGRADES.push({
      id: 'o' + row[0], kind: 'o', factor: 1, hours: row[2], cost: row[1],
      name: 'Night ledger, ' + row[3],
      note: 'Adds ' + row[2] + ' hours to the time clerks keep filing while the office is closed.'
    });
  });
  UPGRADES.sort(function (a, b) { return a.cost - b.cost; });

  var DOCKETS = [
    'A warm copying room',
    'A cold morning',
    'Payday at the town hall',
    'Visitors from the next town',
    'A sketch in the paper',
    'Festival banners',
    'A glut of paper',
    'The night desk'
  ];

  /* Goals pay the larger of a floor and some seconds of current filing.
     The ranks goal from Penny Loop is a stamp combo here. There is no hall. */
  var GOALS = [
    { id: 'stamp5', text: 'Stamp the desk five times', test: { kind: 'stamps', n: 5 }, seconds: 20, floor: 0.6 },
    { id: 'spoon1', text: 'File your first Self-stirring Spoon', test: { kind: 'owned', index: 1, n: 1 }, seconds: 25, floor: 2 },
    { id: 'spoon5', text: 'Own five Self-stirring Spoons', test: { kind: 'owned', index: 1, n: 5 }, seconds: 25, floor: 6 },
    { id: 'clerk1', text: 'Hire your first clerk', test: { kind: 'clerks', n: 1 }, seconds: 30, floor: 30 },
    { id: 'up1', text: 'File your first improvement', test: { kind: 'upgrades', n: 1 }, seconds: 30, floor: 60 },
    { id: 'brolly', text: 'Open the Pocket Umbrella', test: { kind: 'owned', index: 2, n: 1 }, seconds: 30, floor: 120 },
    { id: 'life10k', text: 'File 10K in fees', test: { kind: 'lifetime', n: 1e4 }, seconds: 30, floor: 600 },
    { id: 'clerk3', text: 'Hire three clerks', test: { kind: 'clerks', n: 3 }, seconds: 35, floor: 1500 },
    { id: 'own25', text: 'Own twenty-five of one invention', test: { kind: 'ownedAny', n: 25 }, seconds: 35, floor: 5e3 },
    { id: 'up5', text: 'File five improvements', test: { kind: 'upgrades', n: 5 }, seconds: 35, floor: 2e4 },
    { id: 'ladder', text: 'Open the Folding Stepladder', test: { kind: 'owned', index: 4, n: 1 }, seconds: 35, floor: 6e4 },
    { id: 'combo', text: 'Boost an invention with a stamp combo', test: { kind: 'boosts', n: 1 }, seconds: 40, floor: 2e5 },
    { id: 'life1m', text: 'File 1M in fees', test: { kind: 'lifetime', n: 1e6 }, seconds: 40, floor: 6e5 },
    { id: 'clerk6', text: 'Hire six clerks', test: { kind: 'clerks', n: 6 }, seconds: 40, floor: 3e6 },
    { id: 'glider', text: 'Open the Parcel Glider', test: { kind: 'owned', index: 6, n: 1 }, seconds: 40, floor: 2e7 },
    { id: 'life100m', text: 'File 100M in fees', test: { kind: 'lifetime', n: 1e8 }, seconds: 45, floor: 1e8 },
    { id: 'charter1', text: 'File your first charter', test: { kind: 'charters', n: 1 }, seconds: 45, floor: 4e8 },
    { id: 'clerkAll', text: 'Hire a clerk for every invention', test: { kind: 'clerksAll' }, seconds: 45, floor: 2e9 },
    { id: 'signal', text: 'Open the Signal Kite', test: { kind: 'owned', index: 11, n: 1 }, seconds: 50, floor: 1e10 },
    { id: 'life1t', text: 'File 1T in fees', test: { kind: 'lifetime', n: 1e12 }, seconds: 50, floor: 1e11 },
    { id: 'sky', text: 'Open the Sky-ship', test: { kind: 'owned', index: 12, n: 1 }, seconds: 50, floor: 2e12 },
    { id: 'lifeQa', text: 'File 1Qa in fees', test: { kind: 'lifetime', n: 1e15 }, seconds: 55, floor: 1e14 }
  ];

  var ACHIEVEMENTS = [
    { id: 'first', name: 'First filing', note: 'Stamp the desk once.', test: { kind: 'stamps', n: 1 } },
    { id: 'ten', name: 'Ten stamps', note: 'Stamp the desk ten times.', test: { kind: 'stamps', n: 10 } },
    { id: 'hundred', name: 'A hundred stamps', note: 'Stamp the desk one hundred times.', test: { kind: 'stamps', n: 100 } },
    { id: 'k', name: 'A thousand fees', note: 'File 1K in fees.', test: { kind: 'lifetime', n: 1e3 } },
    { id: 'm', name: 'A million fees', note: 'File 1M in fees.', test: { kind: 'lifetime', n: 1e6 } },
    { id: 'b', name: 'A billion fees', note: 'File 1B in fees.', test: { kind: 'lifetime', n: 1e9 } },
    { id: 't', name: 'A trillion fees', note: 'File 1T in fees.', test: { kind: 'lifetime', n: 1e12 } },
    { id: 'clerk1', name: 'First clerk', note: 'Hire one clerk.', test: { kind: 'clerks', n: 1 } },
    { id: 'clerk6', name: 'Six clerks', note: 'Hire six clerks.', test: { kind: 'clerks', n: 6 } },
    { id: 'clerkAll', name: 'A full desk', note: 'Hire a clerk for every invention.', test: { kind: 'clerksAll' } },
    { id: 'v25', name: 'A full drawer', note: 'Own 25 of one invention.', test: { kind: 'ownedAny', n: 25 } },
    { id: 'v100', name: 'A wall of one idea', note: 'Own 100 of one invention.', test: { kind: 'ownedAny', n: 100 } },
    { id: 'all', name: 'Every invention open', note: 'Own at least one of all eighteen.', test: { kind: 'allOwned' } },
    { id: 'sky', name: 'The sky-ship leaves the yard', note: 'Open the Sky-ship.', test: { kind: 'owned', index: 12, n: 1 } },
    { id: 'qa', name: 'A quadrillion fees', note: 'File 1Qa in fees.', test: { kind: 'lifetime', n: 1e15 } },
    { id: 'up10', name: 'Ten improvements', note: 'File ten improvements.', test: { kind: 'upgrades', n: 10 } },
    { id: 'up25', name: 'Twenty-five improvements', note: 'File twenty-five improvements.', test: { kind: 'upgrades', n: 25 } },
    { id: 'ch1', name: 'First charter', note: 'File one charter.', test: { kind: 'charters', n: 1 } },
    { id: 'ch5', name: 'Five charters', note: 'File five charters.', test: { kind: 'charters', n: 5 } },
    { id: 'seals', name: 'Twenty-five seals', note: 'Hold 25 charter seals.', test: { kind: 'seals', n: 25 } }
  ];

  window.PatentData = {
    INVENTIONS: INVENTIONS,
    UPGRADES: UPGRADES,
    DOCKETS: DOCKETS,
    GOALS: GOALS,
    ACHIEVEMENTS: ACHIEVEMENTS
  };
})();
