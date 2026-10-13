// Observe the browser's actual pack response; never substitute or refetch bytes.
const assert = require('assert/strict');
const crypto = require('crypto');
const hash = body => crypto.createHash('sha256').update(body).digest('hex');
async function navigateWithPack(page, url, expectedBody, evidence, timeout = 90000) {
  const packUrl = new URL('index.pck', url).href;
  Object.assign(evidence, { expectedUrl: packUrl, expectedSha256: hash(expectedBody), expectedBytes: expectedBody.length, responses: [], failedRequests: [] });
  const onResponse = response => evidence.responses.push({ url: response.url(), status: response.status() });
  const onFailed = request => evidence.failedRequests.push({ url: request.url(), failure: request.failure() });
  page.on('response', onResponse);
  page.on('requestfailed', onFailed);
  let session, timer;
  try {
    // The 20 MB PCK and 39 MB WASM can exceed Chromium's per-resource
    // inspector buffer. Reserve bounded room before navigation/body observation.
    session = await page.context().newCDPSession(page);
    await session.send('Network.enable', { maxTotalBufferSize: 128 * 1024 * 1024, maxResourceBufferSize: 64 * 1024 * 1024 });
    let requestId;
    let resolveBody, rejectBody;
    const bodyPromise = new Promise((resolve, reject) => { resolveBody = resolve; rejectBody = reject; });
    timer = setTimeout(() => rejectBody(new Error('Timed out awaiting actual canonical pack CDP body')), timeout);
    bodyPromise.finally(() => clearTimeout(timer)).catch(() => {});
    session.on('Network.responseReceived', event => {
      evidence.responses.push({ observer: 'cdp', url: event.response.url, status: event.response.status, requestId: event.requestId });
      if (event.response.url !== packUrl) return;
      requestId = event.requestId;
      Object.assign(evidence, { requestId, actualUrl: event.response.url, status: event.response.status, fromServiceWorker: !!event.response.fromServiceWorker });
      if (event.response.status !== 200) rejectBody(new Error('Canonical pack CDP response status: ' + event.response.status));
    });
    session.on('Network.loadingFailed', event => {
      evidence.failedRequests.push({ observer: 'cdp', ...event });
      if (event.requestId === requestId) rejectBody(new Error('Canonical pack loading failed: ' + event.errorText));
    });
    session.on('Network.loadingFinished', event => {
      if (event.requestId !== requestId) return;
      // Request IDs and body buffers belong to this configured CDP session.
      // Never call Playwright response.body() through a different session.
      session.send('Network.getResponseBody', { requestId }).then(result => {
        const body = Buffer.from(result.body, result.base64Encoded ? 'base64' : 'utf8');
        Object.assign(evidence, { actualSha256: hash(body), actualBytes: body.length });
        assert.equal(body.length, expectedBody.length, 'Canonical pack response byte count');
        assert.equal(evidence.actualSha256, evidence.expectedSha256, 'Canonical-path browser loads the exact new committed pack');
        return { sha256: evidence.actualSha256, bytes: body.length, url: evidence.actualUrl, status: evidence.status, fromServiceWorker: evidence.fromServiceWorker };
      }).then(resolveBody, rejectBody);
    });
    const pack = page.waitForResponse(response => response.url() === packUrl, { timeout }).then(async response => {
      assert.equal(response.status(), 200, 'Canonical pack response status');
      const finishError = await response.finished();
      assert.equal(finishError, null, 'Canonical pack response finished successfully');
    });
    const [observed, , navigation] = await Promise.all([bodyPromise, pack, page.goto(url, { timeout })]);
    assert.equal(navigation.url(), url, 'Page loads without a cross-site or path redirect');
    assert.equal(navigation.status(), 200, 'Page response status');
    await page.waitForFunction(() => !document.querySelector('#status'), null, { timeout });
    evidence.verified = true;
    return observed;
  } catch (error) {
    evidence.error = error.stack || String(error);
    throw error;
  } finally {
    clearTimeout(timer);
    page.off('response', onResponse);
    page.off('requestfailed', onFailed);
    if (session) await session.detach().catch(() => {});
  }
}
module.exports = { navigateWithPack };
