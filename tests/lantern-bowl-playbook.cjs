/* LB-PLAYBOOK-DATA: the same dependency-free checks run in Node and the browser.
   Browser: LanternPlaybookChecks.runChecks(data, (name, ok) => check(name, ok)).
   Node: node tests/lantern-bowl-playbook.cjs
   This module does not load the match engine or touch the DOM, saves or clocks. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.LanternPlaybookChecks = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const RUN_IDS = ['inside', 'outside', 'counter', 'draw'];
  const PASS_IDS = ['quick', 'deep', 'slant', 'out', 'curl', 'post', 'flat', 'drag'];
  const IDS = RUN_IDS.concat(PASS_IDS);
  const SLOTS = ['wr0', 'wr1', 'te', 'rb'];
  const FORMATIONS = ['iform', 'singleback', 'shotgun'];
  const ROUTE_TYPES = ['go', 'slant', 'out', 'curl', 'post', 'flat', 'drag'];
  const TIERS = ['short', 'intermediate', 'deep'];
  const COMMON_FIELDS = ['id', 'label', 'detail', 'family', 'formation'];
  const RUN_FIELDS = COMMON_FIELDS.concat(['carrierSlot', 'runPath']);
  const PASS_FIELDS = COMMON_FIELDS.concat(['depthTier', 'readOrder', 'routes']);
  const ROUTE_FIELDS = ['routeType', 'waypoints', 'releaseDelaySeconds', 'endBehavior'];
  const COORDINATES = {
    units: 'yards', origin: 'line-of-scrimmage-at-snap', xDirection: 'downfield',
    yDirection: 'offense-right', sidelineY: 24.5, startAuthority: 'first-waypoint',
    authoredXMin: -12, authoredXMax: 40
  };
  const DEPTHS = { short: [0, 8], intermediate: [8, 20], deep: [20, 40] };
  const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const object = value => value !== null && typeof value === 'object' &&
    !Array.isArray(value) && Object.prototype.toString.call(value) === '[object Object]';
  const finite = value => typeof value === 'number' && Number.isFinite(value);

  function hasBreak(points) {
    for (let i = 2; i < points.length; i++) {
      const a = points[i - 2], b = points[i - 1], c = points[i];
      const ax = b.x - a.x, ay = b.y - a.y, bx = c.x - b.x, by = c.y - b.y;
      const al = Math.hypot(ax, ay), bl = Math.hypot(bx, by);
      if (!al || !bl) continue;
      const cross = (ax / al) * (by / bl) - (ay / al) * (bx / bl);
      const dot = (ax / al) * (bx / bl) + (ay / al) * (by / bl);
      // Collinear forward steps are not a break; a curl reversing direction is.
      // Normalization and a small tolerance ignore floating-point straight-line noise.
      if (Math.abs(cross) > 1e-10 || dot < 0) return true;
    }
    return false;
  }

  // Static label consistency, shared by validation and authored assertions.
  // Call only after waypoint types, bounds, lengths and segments are checked.
  function routeIntent(type, points) {
    const first = points[0], previous = points[points.length - 2], last = points[points.length - 1];
    switch (type) {
      case 'go': return !hasBreak(points) && last.x > first.x;
      case 'slant':
      case 'post': return last.x > previous.x && Math.abs(last.y) < Math.abs(previous.y);
      case 'curl': return last.x < previous.x;
      case 'out':
      case 'flat': return first.y * last.y > 0 && first.y * (last.y - previous.y) > 0 && last.x >= previous.x;
      case 'drag': return points.some(point => point.y < 0) && points.some(point => point.y > 0) && last.x >= previous.x;
      default: return false;
    }
  }

  function classifyDepth(x) {
    if (!finite(x) || x < 0 || x > 40) return null;
    return x < 8 ? 'short' : x < 20 ? 'intermediate' : 'deep';
  }

  function validate(data) {
    const errors = [];
    const error = (path, message) => errors.push(path + ': ' + message);

    function record(value, fields, path) {
      if (!object(value)) { error(path, 'must be an object'); return false; }
      let valid = true;
      for (const key of Reflect.ownKeys(value)) {
        if (typeof key !== 'string' || !fields.includes(key)) {
          error(path, 'unknown field ' + String(key)); valid = false;
        } else {
          const descriptor = Object.getOwnPropertyDescriptor(value, key);
          if (!own(descriptor, 'value') || !descriptor.enumerable) {
            error(path + '.' + key, 'must be an enumerable data field'); valid = false;
          }
        }
      }
      for (const field of fields) {
        if (!own(value, field)) { error(path + '.' + field, 'is required'); valid = false; }
      }
      return valid;
    }

    function array(value, path) {
      if (!Array.isArray(value)) { error(path, 'must be an array'); return false; }
      let valid = true, itemCount = 0;
      for (const key of Reflect.ownKeys(value)) {
        if (key === 'length') continue;
        if (typeof key !== 'string' || !/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= value.length) {
          error(path, 'unknown array field ' + String(key)); valid = false;
        } else {
          itemCount++;
          const descriptor = Object.getOwnPropertyDescriptor(value, key);
          if (!own(descriptor, 'value') || !descriptor.enumerable) {
            error(path + '[' + key + ']', 'must be an enumerable data item'); valid = false;
          }
        }
      }
      if (itemCount !== value.length) {
        // Find a missing item using the actual keys, not a potentially enormous
        // sparse length supplied by malformed input.
        let missing = 0;
        while (missing < itemCount && own(value, missing)) missing++;
        error(path + '[' + missing + ']', 'is required (no sparse arrays)'); valid = false;
      }
      return valid;
    }

    function text(value, path) {
      if (typeof value !== 'string' || !value.trim()) error(path, 'must be a nonempty string');
    }

    function enumeration(value, values, path) {
      if (!values.includes(value)) { error(path, 'must be one of ' + values.join(', ')); return false; }
      return true;
    }

    function points(value, path, breaking) {
      if (!array(value, path)) return null;
      let valid = true;
      const minimum = breaking ? 3 : 2;
      if (value.length < minimum) { error(path, 'must have at least ' + minimum + ' waypoints'); valid = false; }
      for (let i = 0; i < value.length; i++) {
        const point = value[i], here = path + '[' + i + ']';
        if (!record(point, ['x', 'y'], here)) { valid = false; continue; }
        if (!finite(point.x) || point.x < -12 || point.x > 40) {
          error(here + '.x', 'must be a finite number from -12 to 40'); valid = false;
        }
        if (!finite(point.y) || Math.abs(point.y) > 24.5) {
          error(here + '.y', 'must be a finite number from -24.5 to 24.5'); valid = false;
        }
        const previous = value[i - 1];
        if (i > 0 && object(previous) && point.x === previous.x && point.y === previous.y) {
          error(here, 'must not repeat the previous waypoint (zero-length segment)'); valid = false;
        }
      }
      if (!valid) return null;
      if (breaking && !hasBreak(value)) error(path, 'breaking route needs a genuine heading change');
      return value.reduce((max, point) => Math.max(max, point.x), -Infinity);
    }

    try {
      if (!record(data, ['schemaVersion', 'coordinates', 'depthTiers', 'plays'], 'playbook')) return errors;
      if (data.schemaVersion !== 1) error('schemaVersion', 'must be the number 1');
      if (record(data.coordinates, Object.keys(COORDINATES), 'coordinates')) {
        for (const key of Object.keys(COORDINATES)) {
          if (data.coordinates[key] !== COORDINATES[key]) {
            error('coordinates.' + key, 'must equal ' + JSON.stringify(COORDINATES[key]));
          }
        }
      }
      if (record(data.depthTiers, TIERS, 'depthTiers')) {
        for (const tier of TIERS) {
          if (!record(data.depthTiers[tier], ['min', 'max'], 'depthTiers.' + tier)) continue;
          if (data.depthTiers[tier].min !== DEPTHS[tier][0]) error('depthTiers.' + tier + '.min', 'must equal ' + DEPTHS[tier][0]);
          if (data.depthTiers[tier].max !== DEPTHS[tier][1]) error('depthTiers.' + tier + '.max', 'must equal ' + DEPTHS[tier][1]);
        }
      }
      if (!array(data.plays, 'plays')) return errors;
      if (data.plays.length !== 12) error('plays', 'must contain exactly 12 plays');
      const ids = new Set(), formations = new Set(), routeTypes = new Set(), tiers = new Set();
      let runs = 0, passes = 0;
      for (let i = 0; i < data.plays.length; i++) {
        const play = data.plays[i], path = 'plays[' + i + ']';
        if (!object(play)) { error(path, 'must be an object'); continue; }
        // Validate family before choosing fields; never coerce malformed primitives.
        const familyDescriptor = Object.getOwnPropertyDescriptor(play, 'family');
        if (!familyDescriptor || !own(familyDescriptor, 'value')) {
          error(path + '.family', 'is required as a data field'); continue;
        }
        if (!enumeration(familyDescriptor.value, ['run', 'pass'], path + '.family')) continue;
        if (!record(play, play.family === 'run' ? RUN_FIELDS : PASS_FIELDS, path)) continue;
        text(play.id, path + '.id'); text(play.label, path + '.label'); text(play.detail, path + '.detail');
        if (typeof play.id === 'string') {
          if (ids.has(play.id)) error(path + '.id', 'duplicate play ID ' + play.id);
          ids.add(play.id);
        }
        enumeration(play.id, play.family === 'run' ? RUN_IDS : PASS_IDS, path + '.id');
        if (enumeration(play.formation, FORMATIONS, path + '.formation')) formations.add(play.formation);
        if (play.family === 'run') {
          runs++;
          if (play.carrierSlot !== 'rb') error(path + '.carrierSlot', 'must equal rb');
          points(play.runPath, path + '.runPath', false);
          continue;
        }
        passes++;
        if (enumeration(play.depthTier, TIERS, path + '.depthTier')) tiers.add(play.depthTier);
        let validReads = array(play.readOrder, path + '.readOrder');
        if (validReads && (play.readOrder.length !== 4 || new Set(play.readOrder).size !== 4 ||
          !play.readOrder.every(slot => SLOTS.includes(slot)))) {
          error(path + '.readOrder', 'must be an exact permutation of wr0, wr1, te, rb'); validReads = false;
        }
        if (!record(play.routes, SLOTS, path + '.routes')) continue;
        for (const slot of SLOTS) {
          const route = play.routes[slot], routePath = path + '.routes.' + slot;
          if (!record(route, ROUTE_FIELDS, routePath)) continue;
          const knownType = enumeration(route.routeType, ROUTE_TYPES, routePath + '.routeType');
          if (knownType) routeTypes.add(route.routeType);
          enumeration(route.endBehavior, ['hold', 'continue'], routePath + '.endBehavior');
          if (route.routeType === 'curl' && route.endBehavior !== 'hold') error(routePath + '.endBehavior', 'curl must hold');
          if (!finite(route.releaseDelaySeconds) || route.releaseDelaySeconds < 0 || route.releaseDelaySeconds > 3) {
            error(routePath + '.releaseDelaySeconds', 'must be a finite number from 0 to 3');
          }
          const maximumX = points(route.waypoints, routePath + '.waypoints', knownType && route.routeType !== 'go');
          if (maximumX !== null && knownType && !routeIntent(route.routeType, route.waypoints)) {
            error(routePath + '.waypoints', route.routeType + ' geometry does not match route intent');
          }
          if (maximumX !== null && validReads && slot === play.readOrder[0] && classifyDepth(maximumX) !== play.depthTier) {
            error(path + '.depthTier', 'must match maximum x on the primary-read route (' + maximumX + ')');
          }
        }
      }
      if (runs !== 4 || passes !== 8) error('plays', 'must include exactly four runs and eight passes');
      for (const id of IDS) if (!ids.has(id)) error('plays', 'missing play ID ' + id);
      for (const formation of FORMATIONS) if (!formations.has(formation)) error('plays', 'missing formation coverage: ' + formation);
      for (const type of ROUTE_TYPES) if (!routeTypes.has(type)) error('plays', 'missing route-type coverage: ' + type);
      for (const tier of TIERS) if (!tiers.has(tier)) error('plays', 'missing primary-read depth coverage: ' + tier);
    } catch (_) {
      // Accessors, revoked proxies and other non-JSON inputs are invalid, never fatal.
      error('playbook', 'cannot inspect malformed data');
    }
    return errors;
  }

  function runChecks(data, check) {
    if (typeof check !== 'function') throw new TypeError('runChecks requires check(name, boolean)');
    let count = 0;
    const report = (name, ok) => { count++; check('playbook: ' + name, Boolean(ok)); };
    const errors = validate(data);
    report('authored data satisfies schema, geometry and coverage' + (errors.length ? ' (' + errors.join('; ') + ')' : ''), errors.length === 0);
    if (errors.length) return count;
    const original = JSON.stringify(data);
    const clone = () => JSON.parse(original);
    const pass = value => value.plays.find(play => play.family === 'pass');
    const run = value => value.plays.find(play => play.family === 'run');
    const route = value => pass(value).routes.wr0;
    const routeOfType = (value, type) => value.plays.filter(play => play.family === 'pass')
      .flatMap(play => SLOTS.map(slot => play.routes[slot])).find(item => item.routeType === type);

    function reject(name, mutate, expected) {
      const fixture = clone();
      mutate(fixture);
      const found = validate(fixture);
      report(name, found.length > 0 && (!expected || found.some(message => message.includes(expected))));
    }
    function accept(name, mutate) {
      const fixture = clone();
      mutate(fixture);
      report(name, validate(fixture).length === 0);
    }

    // Keep per-route evidence alongside the shared static-label validation.
    for (const play of data.plays.filter(item => item.family === 'pass')) {
      for (const slot of SLOTS) {
        const authored = play.routes[slot];
        report(play.id + '/' + slot + ' preserves authored ' + authored.routeType + ' intent', routeIntent(authored.routeType, authored.waypoints));
      }
    }

    report('validation is deterministic', JSON.stringify(validate(data)) === JSON.stringify(errors));
    for (const [name, value] of [['null', null], ['undefined', undefined], ['number', 1], ['string', 'playbook'],
      ['boolean', true], ['array', []], ['function', function () {}], ['date', new Date(0)]]) {
      report('rejects ' + name + ' root without throwing', validate(value).length > 0);
    }
    const revoked = Proxy.revocable({}, {});
    revoked.revoke();
    report('rejects a revoked proxy without throwing', validate(revoked.proxy).length > 0);
    const malformedTag = {};
    Object.defineProperty(malformedTag, Symbol.toStringTag, { get() { throw new Error('not data'); } });
    report('rejects an uninspectable object tag without throwing', validate(malformedTag).length > 0);
    for (const field of ['schemaVersion', 'coordinates', 'depthTiers', 'plays']) {
      reject('requires top-level ' + field, value => { delete value[field]; }, field);
    }
    reject('rejects unknown top-level fields', value => { value.ratings = {}; }, 'unknown field ratings');
    for (const value of [0, 2, '1', null, true, NaN, Infinity]) {
      reject('rejects schema version ' + String(value) + ' (' + typeof value + ')', fixture => { fixture.schemaVersion = value; }, 'schemaVersion');
    }
    for (const field of Object.keys(COORDINATES)) {
      reject('requires coordinate field ' + field, value => { delete value.coordinates[field]; }, 'coordinates.' + field);
      reject('rejects altered coordinate field ' + field, value => { value.coordinates[field] = typeof COORDINATES[field] === 'number' ? String(COORDINATES[field]) : 'other'; }, 'coordinates.' + field);
    }
    reject('rejects unknown coordinate metadata', value => { value.coordinates.formationOffset = true; }, 'unknown field formationOffset');
    reject('rejects unknown tier metadata', value => { value.depthTiers.long = { min: 40, max: 60 }; }, 'unknown field long');
    for (const tier of TIERS) {
      reject('requires depth tier ' + tier, value => { delete value.depthTiers[tier]; }, 'depthTiers.' + tier);
      for (const bound of ['min', 'max']) {
        reject('requires ' + tier + ' ' + bound, value => { delete value.depthTiers[tier][bound]; }, 'depthTiers.' + tier + '.' + bound);
        reject('rejects altered ' + tier + ' ' + bound, value => { value.depthTiers[tier][bound]++; }, 'depthTiers.' + tier + '.' + bound);
      }
    }
    reject('rejects unknown tier bounds', value => { value.depthTiers.short.exclusive = true; }, 'unknown field exclusive');

    for (const [name, access] of [['run', run], ['pass', pass]]) {
      const fields = name === 'run' ? RUN_FIELDS : PASS_FIELDS;
      for (const field of fields) reject('requires ' + name + ' ' + field, value => { delete access(value)[field]; }, field);
      reject('rejects unknown ' + name + ' fields', value => { access(value).simulation = {}; }, 'unknown field simulation');
      for (const field of ['id', 'label', 'detail']) {
        for (const invalid of ['', '  ', 9, null, [], {}]) {
          reject('rejects malformed ' + name + ' ' + field + ' ' + JSON.stringify(invalid), value => { access(value)[field] = invalid; }, '.' + field);
        }
      }
      reject('rejects unknown ' + name + ' formation', value => { access(value).formation = 'spread'; }, '.formation');
      reject('rejects unknown ' + name + ' family', value => { access(value).family = 'kick'; }, '.family');
    }
    reject('rejects duplicate play IDs', value => { value.plays[1].id = value.plays[0].id; }, 'duplicate play ID');
    reject('rejects an unknown play ID', value => { pass(value).id = 'screen'; }, '.id');
    reject('rejects a run ID on a pass', value => { pass(value).id = 'inside'; }, '.id');
    reject('rejects a pass ID on a run', value => { run(value).id = 'quick'; }, '.id');
    reject('rejects eleven plays', value => { value.plays.pop(); }, 'exactly 12');
    reject('rejects thirteen plays', value => { value.plays.push(value.plays[0]); }, 'exactly 12');
    reject('rejects a non-rb run carrier', value => { run(value).carrierSlot = 'qb'; }, '.carrierSlot');
    for (const field of ['routes', 'readOrder', 'depthTier']) {
      reject('rejects pass-only ' + field + ' on runs', value => { run(value)[field] = pass(value)[field]; }, 'unknown field ' + field);
    }
    for (const field of ['carrierSlot', 'runPath']) {
      reject('rejects run-only ' + field + ' on passes', value => { pass(value)[field] = run(value)[field]; }, 'unknown field ' + field);
    }

    const shapes = [
      ['coordinates', (value, bad) => { value.coordinates = bad; }],
      ['depthTiers', (value, bad) => { value.depthTiers = bad; }],
      ['depth tier', (value, bad) => { value.depthTiers.short = bad; }],
      ['plays', (value, bad) => { value.plays = bad; }],
      ['play', (value, bad) => { value.plays[0] = bad; }],
      ['routes', (value, bad) => { pass(value).routes = bad; }],
      ['route', (value, bad) => { pass(value).routes.wr0 = bad; }],
      ['readOrder', (value, bad) => { pass(value).readOrder = bad; }],
      ['waypoints', (value, bad) => { route(value).waypoints = bad; }],
      ['route point', (value, bad) => { route(value).waypoints[0] = bad; }],
      ['runPath', (value, bad) => { run(value).runPath = bad; }],
      ['run point', (value, bad) => { run(value).runPath[0] = bad; }]
    ];
    for (const [name, set] of shapes) {
      for (const invalid of [null, undefined, false, 17, 'bad', [], {}]) {
        reject('rejects malformed ' + name + ' ' + String(invalid), value => { set(value, invalid); });
      }
    }
    for (const slot of SLOTS) {
      reject('requires route slot ' + slot, value => { delete pass(value).routes[slot]; }, 'routes.' + slot);
    }
    reject('rejects a fifth route slot', value => { pass(value).routes.qb = route(value); }, 'unknown field qb');
    reject('rejects duplicate read slots', value => { pass(value).readOrder[1] = pass(value).readOrder[0]; }, '.readOrder');
    reject('rejects an unknown read slot', value => { pass(value).readOrder[1] = 'qb'; }, '.readOrder');
    reject('rejects a nonstring read slot', value => { pass(value).readOrder[1] = 1; }, '.readOrder');
    reject('rejects a missing read slot', value => { pass(value).readOrder.pop(); }, '.readOrder');
    reject('rejects a fifth read slot', value => { pass(value).readOrder.push('wr0'); }, '.readOrder');
    reject('rejects a sparse read order', value => { delete pass(value).readOrder[1]; }, '.readOrder');
    reject('rejects sparse plays', value => { delete value.plays[0]; }, 'plays[0]');
    reject('rejects enormous sparse arrays without walking their length', value => { value.plays.length = 1000000000; }, 'sparse arrays');
    reject('rejects sparse waypoints', value => { delete route(value).waypoints[1]; }, '.waypoints[1]');
    reject('rejects custom array fields', value => { value.plays.extra = true; }, 'unknown array field');

    for (const field of ROUTE_FIELDS) reject('requires route ' + field, value => { delete route(value)[field]; }, field);
    reject('rejects unknown route fields', value => { route(value).speed = 85; }, 'unknown field speed');
    reject('rejects an unknown route type', value => { route(value).routeType = 'zigzag'; }, '.routeType');
    reject('rejects a nonstring route type', value => { route(value).routeType = 1; }, '.routeType');
    reject('rejects an unknown route ending', value => { route(value).endBehavior = 'loop'; }, '.endBehavior');
    reject('rejects a nonstring route ending', value => { route(value).endBehavior = false; }, '.endBehavior');
    reject('requires curls to hold', value => { routeOfType(value, 'curl').endBehavior = 'continue'; }, 'curl must hold');
    for (const delay of [-0.01, 3.01, NaN, Infinity, -Infinity, '0', null, false, {}, []]) {
      reject('rejects release delay ' + String(delay) + ' (' + typeof delay + ')', value => { route(value).releaseDelaySeconds = delay; }, '.releaseDelaySeconds');
    }
    for (const delay of [0, 0.25, 3]) accept('accepts release delay ' + delay, value => { route(value).releaseDelaySeconds = delay; });

    for (const [name, path] of [['pass', value => route(value).waypoints], ['run', value => run(value).runPath]]) {
      for (const axis of ['x', 'y']) {
        reject('requires ' + name + ' point ' + axis, value => { delete path(value)[0][axis]; }, '.' + axis);
        for (const invalid of [NaN, Infinity, -Infinity, '1', null, true, {}, []]) {
          reject('rejects ' + name + ' ' + axis + ' ' + String(invalid) + ' (' + typeof invalid + ')', value => { path(value)[0][axis] = invalid; }, '.' + axis);
        }
      }
      reject('rejects unknown ' + name + ' point fields', value => { path(value)[0].z = 0; }, 'unknown field z');
      reject('rejects repeated adjacent ' + name + ' points', value => { path(value)[1] = { ...path(value)[0] }; }, 'zero-length segment');
      for (const [axis, invalid] of [['x', -12.001], ['x', 40.001], ['y', -24.501], ['y', 24.501]]) {
        reject('rejects out-of-bounds ' + name + ' ' + axis + '=' + invalid, value => { path(value)[0][axis] = invalid; }, '.' + axis);
      }
    }
    reject('rejects a one-point run', value => { run(value).runPath.length = 1; }, 'at least 2');
    reject('rejects a one-point go', value => { routeOfType(value, 'go').waypoints.length = 1; }, 'at least 2');
    for (const type of ROUTE_TYPES.filter(item => item !== 'go')) {
      reject('requires a stem and break for ' + type, value => { routeOfType(value, type).waypoints = [{ x: 0, y: 0 }, { x: 5, y: 1 }]; }, 'at least 3');
      reject('rejects collinear forward ' + type, value => { routeOfType(value, type).waypoints = [{ x: 0, y: 0 }, { x: 2, y: 1 }, { x: 6, y: 3 }]; }, 'genuine heading change');
    }
    reject('rejects a go with two right-angle cuts', value => {
      value.plays.find(play => play.id === 'deep').routes.wr0.waypoints = [{ x: 0, y: -18 }, { x: 12, y: -18 }, { x: 12, y: 18 }, { x: 31, y: 18 }];
    }, 'go geometry does not match route intent');
    reject('rejects a slant whose final leg runs backwards', value => {
      value.plays.find(play => play.id === 'slant').routes.wr0.waypoints = [{ x: 0, y: -18 }, { x: 12, y: -18 }, { x: 6, y: -10 }];
    }, 'slant geometry does not match route intent');
    reject('rejects a post whose final leg runs backwards', value => {
      value.plays.find(play => play.id === 'deep').routes.wr1.waypoints = [{ x: 0, y: 16 }, { x: 13, y: 16 }, { x: 8, y: 3 }];
    }, 'post geometry does not match route intent');
    const wrongDirections = [
      ['go', 'runs straight backwards', [[6, -18], [0, -18]]],
      ['go', 'runs only sideways', [[10, -18], [10, -10]]],
      ['go', 'reverses after a forward stem', [[0, -18], [31, -18], [25, -18]]],
      ['slant', 'finishes outward', [[0, -18], [4, -18], [6, -21]]],
      ['slant', 'does not advance on its final leg', [[0, -18], [6, -18], [6, -10]]],
      ['post', 'finishes outward', [[0, 16], [8, 16], [23, 20]]],
      ['post', 'does not advance on its final leg', [[0, 16], [13, 16], [13, 3]]],
      ['curl', 'finishes forward below an earlier maximum', [[0, -18], [12, -18], [6, -17], [8, -16]]],
      ['curl', 'finishes sideways', [[0, -18], [12, -18], [12, -16]]],
      ['out', 'turns inward after an outward stem', [[0, -6], [4, -20], [6, -12]]],
      ['out', 'finishes on the opposite sideline', [[0, 6], [2, 6], [4, -12]]],
      ['out', 'finishes backwards', [[0, 6], [6, 6], [4, 12]]],
      ['flat', 'turns inward after an outward stem', [[0, -6], [4, -20], [6, -12]]],
      ['flat', 'finishes on the opposite sideline', [[0, 6], [2, 6], [4, -12]]],
      ['flat', 'finishes backwards', [[0, 6], [6, 6], [4, 12]]],
      ['drag', 'never crosses the middle', [[0, -18], [4, -18], [6, -2]]],
      ['drag', 'crosses with a backwards final leg', [[0, -18], [8, -18], [6, 6]]]
    ];
    for (const [type, reason, coordinates] of wrongDirections) {
      reject('rejects ' + type + ' that ' + reason, value => {
        routeOfType(value, type).waypoints = coordinates.map(([x, y]) => ({ x, y }));
      }, type + ' geometry does not match route intent');
    }
    accept('accepts a straight two-point go', value => {
      const found = value.plays.find(play => play.id === 'deep');
      found.routes[found.readOrder[0]].routeType = 'go';
      found.routes[found.readOrder[0]].waypoints = [{ x: 0, y: -18 }, { x: 25, y: -18 }];
    });
    accept('accepts a straight go with more than two points', value => {
      const found = value.plays.find(play => play.id === 'deep');
      found.routes[found.readOrder[0]].routeType = 'go';
      found.routes[found.readOrder[0]].waypoints = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 25, y: 0 }];
    });
    accept('accepts a collinear curl reversal and measures its deepest point', value => {
      const found = value.plays.find(play => play.id === 'curl');
      found.depthTier = 'intermediate';
      found.routes[found.readOrder[0]] = { routeType: 'curl', waypoints: [{ x: 0, y: -18 }, { x: 12, y: -18 }, { x: 6, y: -18 }], releaseDelaySeconds: 0, endBehavior: 'hold' };
    });
    accept('accepts inclusive field bounds and authored negative starts', value => {
      run(value).runPath = [{ x: -12, y: -24.5 }, { x: 40, y: 24.5 }];
    });
    accept('treats first waypoints as authoritative without formation offsets', value => {
      const found = pass(value), secondary = found.readOrder[1];
      found.routes[secondary] = { routeType: 'out', waypoints: [{ x: -12, y: 20 }, { x: -1, y: 20 }, { x: -1, y: 24.5 }], releaseDelaySeconds: 0, endBehavior: 'hold' };
    });

    reject('rejects an unknown depth tier', value => { pass(value).depthTier = 'long'; }, '.depthTier');
    reject('rejects mismatched primary-read depth', value => { pass(value).depthTier = 'deep'; }, 'maximum x on the primary-read route');
    reject('rejects a primary route wholly behind the line', value => {
      const found = pass(value);
      found.routes[found.readOrder[0]].waypoints = [{ x: -10, y: 0 }, { x: -5, y: 0 }, { x: -1, y: 2 }];
    }, 'maximum x on the primary-read route');
    for (const [depth, tier] of [[0, 'short'], [7.999, 'short'], [8, 'intermediate'], [19.999, 'intermediate'], [20, 'deep'], [40, 'deep']]) {
      accept('classifies primary-read maximum x=' + depth + ' as ' + tier, value => {
        const found = value.plays.find(play => play.id === 'quick');
        found.depthTier = tier;
        found.routes[found.readOrder[0]] = { routeType: 'slant', waypoints: [{ x: -2, y: -18 }, { x: -1, y: -18 }, { x: depth, y: -11 }], releaseDelaySeconds: 0, endBehavior: 'hold' };
      });
    }
    accept('measures readOrder[0] rather than wr0 or the deepest secondary route', value => {
      const found = value.plays.find(play => play.id === 'quick');
      found.readOrder = ['rb', 'te', 'wr1', 'wr0']; found.depthTier = 'short';
      found.routes.rb = { routeType: 'flat', waypoints: [{ x: -5, y: 5 }, { x: -1, y: 5 }, { x: 2, y: 12 }], releaseDelaySeconds: 0, endBehavior: 'hold' };
      found.routes.wr0 = { routeType: 'slant', waypoints: [{ x: 0, y: -18 }, { x: 5, y: -18 }, { x: 30, y: -8 }], releaseDelaySeconds: 0, endBehavior: 'hold' };
    });
    for (const type of ROUTE_TYPES) {
      reject('requires catalogue coverage for route type ' + type, value => {
        for (const found of value.plays.filter(play => play.family === 'pass')) {
          for (const slot of SLOTS) if (found.routes[slot].routeType === type) found.routes[slot].routeType = type === 'go' ? 'slant' : 'go';
        }
      }, 'missing route-type coverage: ' + type);
    }
    for (const formation of FORMATIONS) {
      reject('requires catalogue coverage for ' + formation, value => {
        for (const found of value.plays) if (found.formation === formation) found.formation = formation === 'shotgun' ? 'iform' : 'shotgun';
      }, 'missing formation coverage: ' + formation);
    }
    for (const tier of TIERS) {
      reject('requires catalogue depth coverage for ' + tier, value => {
        for (const found of value.plays) if (found.depthTier === tier) found.depthTier = tier === 'short' ? 'deep' : 'short';
      }, 'missing primary-read depth coverage: ' + tier);
    }
    reject('rejects getters without invoking them', value => {
      Object.defineProperty(value.coordinates, 'units', { enumerable: true, get() { throw new Error('not data'); } });
    }, 'enumerable data field');
    reject('rejects inherited required fields', value => {
      const inherited = { units: value.coordinates.units };
      delete value.coordinates.units; Object.setPrototypeOf(value.coordinates, inherited);
    }, 'coordinates.units');
    reject('rejects a cyclic malformed route point without throwing', value => { route(value).waypoints[0] = value; }, 'unknown field');
    reject('rejects a symbol field', value => { route(value)[Symbol('hidden')] = true; }, 'unknown field');
    report('leaves the supplied data unchanged', JSON.stringify(data) === original);
    return count;
  }

  return Object.freeze({ validate, runChecks });
});

if (typeof module === 'object' && module.exports && typeof require === 'function' && require.main === module) {
  try {
    const fs = require('node:fs'), path = require('node:path');
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../games/lantern-bowl/playbook.json'), 'utf8'));
    let passed = 0, failed = 0;
    module.exports.runChecks(data, (name, ok) => {
      if (ok) passed++;
      else { failed++; console.error('FAIL ' + name); }
    });
    console.log((failed ? 'FAIL' : 'PASS') + ': ' + passed + ' Lantern Bowl playbook checks passed, ' + failed + ' failed.');
    if (failed) process.exitCode = 1;
  } catch (error) {
    console.error('FAIL Lantern Bowl playbook: ' + error.message);
    process.exitCode = 1;
  }
}
