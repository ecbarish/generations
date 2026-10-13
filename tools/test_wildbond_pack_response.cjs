const assert = require('assert/strict');
const { EventEmitter } = require('events');
const { navigateWithPack } = require('./wildbond-pack-response.cjs');
const url = 'http://127.0.0.1:1234/generations/play/wildbond/';
const bytes = Buffer.from('committed pack');
function fake(options = {}) {
  const page = new EventEmitter(), session = new EventEmitter();
  let predicate, resolve, reject, enabled = false, finished = false;
  session.send = async (method, args) => {
    if(method === 'Network.enable') { assert(args.maxResourceBufferSize > 20398356); enabled = true; return; }
    assert.equal(method, 'Network.getResponseBody'); assert(enabled && finished, 'Same configured session reads only after loadingFinished'); assert.equal(args.requestId, 'pack-id');
    if(options.bodyError) throw new Error(options.bodyError);
    return { body: (options.bytes || bytes).toString('base64'), base64Encoded: true };
  };
  session.detach = async () => {};
  page.context = () => ({ newCDPSession: async () => session });
  page.waitForResponse = test => { predicate = test; return new Promise((a,b) => { resolve = a; reject = b; }); };
  page.goto = async target => {
    assert(predicate, 'Response waiter installed before navigation'); assert(enabled);
    assert.equal(target,url);
    const response = { url: () => options.url || url+'index.pck', status: () => options.status || 200,
      finished: async () => options.finishError || null, body: async () => { throw new Error('Must not use Playwright session body'); } };
    page.emit('response',response);
    session.emit('Network.responseReceived', { requestId: 'pack-id', response: { url: response.url(), status: response.status() } });
    if(predicate(response)) resolve(response); else reject(new Error('Exact pack URL not observed'));
    setTimeout(() => { finished = true; session.emit('Network.loadingFinished',{requestId:'pack-id'}); }, 10);
    return { url: () => url, status: () => 200 };
  };
  page.waitForFunction = async () => {};
  return page;
}
(async () => {
  const evidence = {};
  const result = await navigateWithPack(fake(),url,bytes,evidence);
  assert(evidence.verified); assert.equal(result.bytes,bytes.length);
  for(const options of [{status:404},{finishError:new Error('Response stream failed')},{bytes:Buffer.from('short')},{bytes:Buffer.from('different pack')},{bodyError:'Request content was evicted from inspector cache'}, {url:'http://127.0.0.1:1234/idle-arcade/play/wildbond/index.pck'}, {url:url+'index.pck?unexpected=1'}]) {
    const e = {}; const p = fake(options);
    await assert.rejects(navigateWithPack(p,url,bytes,e));
    assert(e.error); assert(!e.verified); assert(e.responses.length >= 1);
    if(options.bodyError) assert(e.error.includes(options.bodyError));
    assert.equal(p.listenerCount('response'),0);
  }
  console.log('PASS pack observer: preinstalled waiter, same-session buffers/body after loadingFinished, strict URL/status/bytes/hash, diagnostic stream/body errors');
})().catch(error => { console.error(error); process.exitCode=1; });
