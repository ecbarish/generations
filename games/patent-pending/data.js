/* Patent Pending content. The ladder is Penny Loop's, one invention to one venture.
   Costs and payouts are that ladder times 100, so the early coins read 5, 100, 1,200
   instead of 0.05. Names, blurbs and the docket are original. No page, no storage. */
(function () {
  'use strict';

  function svg(body) {
    return '<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">' + body + '</svg>';
  }
  var ink = '#1c2430';
  var seal = '#9c2f2f';
  var brass = '#8a6a32';

  var INVENTIONS = [
    { id: 'clip', name: 'Better Paperclip', blurb: 'It holds the stack and still lets one page go.', clerk: 'Clerk Pip', base: 0.05, growth: 1.07, revenue: 0.12, cycle: 1, hire: 4.5,
      icon: svg('<path d="M8 7a4 4 0 0 1 8 0v8a2.5 2.5 0 0 1-5 0V8" fill="none" stroke="' + ink + '" stroke-width="2" stroke-linecap="round"/>') },
    { id: 'spoon', name: 'Self-stirring Spoon', blurb: 'The spoon keeps the cocoa moving while you stamp.', clerk: 'Inventor Nib', base: 10, growth: 1.12, revenue: 0.18, cycle: 1, hire: 11,
      icon: svg('<path d="M12 3c2 3 2 5 0 7-2 2-2 4 0 11" fill="none" stroke="' + brass + '" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="6" r="2.2" fill="' + seal + '"/>') },
    { id: 'brolly', name: 'Pocket Umbrella', blurb: 'It opens inside a coat and somehow stays dry.', clerk: 'Clerk Brolly', base: 18, growth: 1.12, revenue: 0.22, cycle: 1, hire: 20,
      icon: svg('<path d="M4 10c2-5 14-5 16 0" fill="none" stroke="' + seal + '" stroke-width="2"/><path d="M12 10v9" stroke="' + ink + '" stroke-width="2" stroke-linecap="round"/>') },
    { id: 'bell', name: 'Quiet Doorbell', blurb: 'It rings in a colour, for houses that hate noise.', clerk: 'Inventor Hush', base: 36, growth: 1.12, revenue: 0.3, cycle: 1, hire: 34,
      icon: svg('<path d="M6 14a6 6 0 0 1 12 0" fill="none" stroke="' + brass + '" stroke-width="2"/><rect x="10" y="14" width="4" height="3" rx="1" fill="' + ink + '"/>') },
    { id: 'ladder', name: 'Folding Stepladder', blurb: 'Three steps, and it hides behind a door.', clerk: 'Clerk Rung', base: 64, growth: 1.12, revenue: 0.42, cycle: 1, hire: 60,
      icon: svg('<path d="M7 20l4-16M17 20l-4-16M8 10h8M9 14h6" fill="none" stroke="' + ink + '" stroke-width="2" stroke-linecap="round"/>') },
    { id: 'crank', name: 'Window Crank', blurb: 'One turn, and the stiff sash gives up.', clerk: 'Inventor Sash', base: 110, growth: 1.11, revenue: 0.58, cycle: 1, hire: 100,
      icon: svg('<circle cx="12" cy="12" r="4" fill="none" stroke="' + brass + '" stroke-width="2"/><path d="M12 8V3M16 12h5" stroke="' + ink + '" stroke-width="2" stroke-linecap="round"/>') },
    { id: 'glider', name: 'Parcel Glider', blurb: 'A paper wing that lands on the right porch.', clerk: 'Clerk Glide', base: 160, growth: 1.1, revenue: 0.7, cycle: 1, hire: 150,
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

  /* Penny Loop's own base, growth, payout and cycle, in order, times 100 coins. */
  var PENNY = [
    [0.05, 1.07, 0.01, 0.5],
    [1, 1.15, 0.55, 3],
    [12, 1.14, 4.5, 6],
    [140, 1.13, 34, 12],
    [1600, 1.12, 260, 24],
    [1.8e4, 1.11, 1900, 48],
    [2.2e5, 1.1, 1.5e4, 96],
    [2.6e6, 1.09, 1.15e5, 192],
    [3.2e7, 1.08, 9.2e5, 384],
    [4e8, 1.07, 7.6e6, 768],
    [5e9, 1.06, 6.6e7, 1536],
    [6e10, 1.05, 5.6e8, 3072],
    [7.2e11, 1.048, 2.95e9, 4096],
    [8.6e12, 1.046, 1.47e10, 5120],
    [1.04e14, 1.044, 7.08e10, 6144],
    [1.24e15, 1.042, 2.83e11, 6144],
    [1.49e16, 1.04, 1.33e12, 7200],
    [1.79e17, 1.038, 5.31e12, 7200]
  ];
  INVENTIONS.forEach(function (v, i) {
    v.base = PENNY[i][0] * 100;
    v.growth = PENNY[i][1];
    v.revenue = PENNY[i][2] * 100;
    v.cycle = PENNY[i][3];
    delete v.hire;
  });
  /* base × 90 would be 450. A slower stamp still meets Pip in about a minute. */
  INVENTIONS[0].hire = 120;

  var TIERS = ['A small change', 'A better change', 'A lasting change'];
  /* The first tier stays on Penny Loop's price, so the opening minutes do too.
     The later tiers cost more, and a lasting change is ×2 rather than ×4,
     so the next filing after the third minute takes about a minute of saving. */
  var TIER_MATH = [[220, 3], [28000, 3], [90000, 2]];
  var UPGRADES = [];
  INVENTIONS.forEach(function (v, i) {
    TIER_MATH.forEach(function (pair, k) {
      UPGRADES.push({
        id: 'v' + i + '_' + k,
        kind: 'v',
        invention: i,
        factor: pair[1],
        cost: v.base * pair[0] * (k > 0 && i > 0 ? Math.pow(3, i) : 1),
        name: TIERS[k] + ' for the ' + v.name + ' ×' + pair[1],
        note: 'The ' + v.name + ' files ' + pair[1] + ' times as much.'
      });
    });
  });
  var BUREAU = ['A second inkwell', 'A clerk\'s lamp', 'A wider blotter', 'A second press', 'A quiet hour', 'A full cabinet', 'A brass date stamp', 'The grand seal'];
  /* The first lamp stays ×2 at 6,000. Later lamps stay ×2 and are priced so each
     one takes about a minute and a half of filing once the early drawer is full. */
  [[1, 6000, 2], [2, 1.2e6, 2], [3, 2.8e6, 2], [4, 6.5e6, 2], [5, 2.5e7, 2], [6, 8e7, 2], [7, 2.5e8, 2], [8, 8e8, 2]].forEach(function (row, n) {
    UPGRADES.push({
      id: 'g' + row[0], kind: 'g', factor: row[2], cost: row[1],
      name: BUREAU[n] + ' ×' + row[2],
      note: 'Every invention files ' + row[2] + ' times as much.'
    });
  });
  var STAMPS = ['A quicker wrist', 'A second pad', 'Ink that bites', 'A standing desk', 'Both hands', 'The rhythm'];
  [[1, 2500, 3], [2, 180000, 3], [3, 1.4e7, 4], [4, 1.1e9, 5], [5, 8e10, 5], [6, 6e12, 5]].forEach(function (row, n) {
    UPGRADES.push({
      id: 't' + row[0], kind: 't', factor: row[2], cost: row[1],
      name: STAMPS[n] + ' ×' + row[2],
      note: 'Stamping an invention with no clerk pays ' + row[2] + ' times the desk fee. The fee stays a fixed number of coins.'
    });
  });
  [[1, 5e6, 4, 'four more hours'], [2, 3e9, 4, 'four more hours again'], [3, 2e12, 12, 'twelve more hours']].forEach(function (row) {
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

  /* Goals pay 30 to 60 seconds of clerk income. The floor is unused.
     The ranks goal from Penny Loop is a stamp combo here. There is no hall. */
  var GOALS = [
    { id: 'stamp5', text: 'Stamp the desk five times', test: { kind: 'stamps', n: 5 }, seconds: 30, floor: 0 },
    { id: 'spoon1', text: 'File your first Self-stirring Spoon', test: { kind: 'owned', index: 1, n: 1 }, seconds: 30, floor: 0 },
    { id: 'spoon5', text: 'Own five Self-stirring Spoons', test: { kind: 'owned', index: 1, n: 5 }, seconds: 30, floor: 0 },
    { id: 'clerk1', text: 'Hire your first clerk', test: { kind: 'clerks', n: 1 }, seconds: 30, floor: 0 },
    { id: 'up1', text: 'File your first improvement', test: { kind: 'upgrades', n: 1 }, seconds: 30, floor: 0 },
    { id: 'brolly', text: 'Open the Pocket Umbrella', test: { kind: 'owned', index: 2, n: 1 }, seconds: 30, floor: 0 },
    { id: 'life10k', text: 'File 1M in fees', test: { kind: 'lifetime', n: 1e6 }, seconds: 30, floor: 0 },
    { id: 'clerk3', text: 'Hire three clerks', test: { kind: 'clerks', n: 3 }, seconds: 35, floor: 0 },
    { id: 'halfhour', text: 'Come back after the clerks have had twenty minutes', test: { kind: 'away', n: 1200 }, seconds: 45, floor: 0 },
    { id: 'own25', text: 'Own twenty-five of one invention', test: { kind: 'ownedAny', n: 25 }, seconds: 35, floor: 5e3 },
    { id: 'up5', text: 'File five improvements', test: { kind: 'upgrades', n: 5 }, seconds: 35, floor: 2e4 },
    { id: 'ladder', text: 'Open the Folding Stepladder', test: { kind: 'owned', index: 4, n: 1 }, seconds: 35, floor: 6e4 },
    { id: 'combo', text: 'Boost an invention with a stamp combo', test: { kind: 'boosts', n: 1 }, seconds: 40, floor: 2e5 },
    { id: 'life1m', text: 'File 100M in fees', test: { kind: 'lifetime', n: 1e8 }, seconds: 40, floor: 6e5 },
    { id: 'clerk6', text: 'Hire six clerks', test: { kind: 'clerks', n: 6 }, seconds: 40, floor: 3e6 },
    { id: 'glider', text: 'Open the Parcel Glider', test: { kind: 'owned', index: 6, n: 1 }, seconds: 40, floor: 2e7 },
    { id: 'life100m', text: 'File 10B in fees', test: { kind: 'lifetime', n: 1e10 }, seconds: 45, floor: 1e8 },
    { id: 'charter1', text: 'File your first charter', test: { kind: 'charters', n: 1 }, seconds: 45, floor: 4e8 },
    { id: 'clerkAll', text: 'Hire a clerk for every invention', test: { kind: 'clerksAll' }, seconds: 45, floor: 2e9 },
    { id: 'signal', text: 'Open the Signal Kite', test: { kind: 'owned', index: 11, n: 1 }, seconds: 50, floor: 1e10 },
    { id: 'life1t', text: 'File 100T in fees', test: { kind: 'lifetime', n: 1e14 }, seconds: 50, floor: 1e11 },
    { id: 'sky', text: 'Open the Sky-ship', test: { kind: 'owned', index: 12, n: 1 }, seconds: 50, floor: 2e12 },
    { id: 'lifeQa', text: 'File 100Qa in fees', test: { kind: 'lifetime', n: 1e17 }, seconds: 55, floor: 1e14 }
  ];

  var ACHIEVEMENTS = [
    { id: 'first', name: 'First filing', note: 'Stamp the desk once.', test: { kind: 'stamps', n: 1 } },
    { id: 'ten', name: 'Ten stamps', note: 'Stamp the desk ten times.', test: { kind: 'stamps', n: 10 } },
    { id: 'hundred', name: 'A hundred stamps', note: 'Stamp the desk one hundred times.', test: { kind: 'stamps', n: 100 } },
    { id: 'k', name: 'A hundred thousand fees', note: 'File 100K in fees.', test: { kind: 'lifetime', n: 1e5 } },
    { id: 'm', name: 'A hundred million fees', note: 'File 100M in fees.', test: { kind: 'lifetime', n: 1e8 } },
    { id: 'b', name: 'A hundred billion fees', note: 'File 100B in fees.', test: { kind: 'lifetime', n: 1e11 } },
    { id: 't', name: 'A hundred trillion fees', note: 'File 100T in fees.', test: { kind: 'lifetime', n: 1e14 } },
    { id: 'clerk1', name: 'First clerk', note: 'Hire one clerk.', test: { kind: 'clerks', n: 1 } },
    { id: 'clerk6', name: 'Six clerks', note: 'Hire six clerks.', test: { kind: 'clerks', n: 6 } },
    { id: 'clerkAll', name: 'A full desk', note: 'Hire a clerk for every invention.', test: { kind: 'clerksAll' } },
    { id: 'v25', name: 'A full drawer', note: 'Own 25 of one invention.', test: { kind: 'ownedAny', n: 25 } },
    { id: 'v100', name: 'A wall of one idea', note: 'Own 100 of one invention.', test: { kind: 'ownedAny', n: 100 } },
    { id: 'all', name: 'Every invention open', note: 'Own at least one of all eighteen.', test: { kind: 'allOwned' } },
    { id: 'sky', name: 'The sky-ship leaves the yard', note: 'Open the Sky-ship.', test: { kind: 'owned', index: 12, n: 1 } },
    { id: 'qa', name: 'A hundred quadrillion fees', note: 'File 100Qa in fees.', test: { kind: 'lifetime', n: 1e17 } },
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
