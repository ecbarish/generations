# Agent efficiency: actual trial and a smaller entry path

2026-10-13, Evan asked whether local/free tools can help and how to stop loading the whole project every session.

## Recommendation

Adopt scoped task packets first. Keep the existing local helper for small, mechanically checked work; its three
fresh fixture results do not justify autonomous design or review. OpenHuman can reach Ollama, but the tested
file-agent entry is not ready in our isolated unauthenticated setup. Free cloud APIs are an optional later
comparison after a provider key is deliberately configured; they were not benchmarked here.

## Measured results

| Test | Result | Time |
|---|---|---|
| OpenCode + local model: exact gift lookup | Pass; used read tool and returned the right three names | 147.95 s |
| Same runner: formatting fix | Failed independent Node check; inserted an unwanted comma | 104.25 s |
| Same runner: factual guide audit | Failed; called a matching guide a mismatch | 95.12 s |
| Extracted OpenHuman v0.64.15: explicit Ollama connection | Pass, LOCAL_READY | 0.67 s |
| OpenHuman: one-shot file-agent call | Failed: no hosted authority | 0.11 s |
| Local model: larger legacy context, same current-task question | Timed out | 180.08 s |
| Local model: fresh scoped task packet, same question | Pass; **2,126 prompt tokens**, 46 output tokens | 49.59 s |

This is a tiny correctness sample, not a general ranking. The gift/guide fixtures are synthetic with known answers.
The model made two errors; checks caught them. OpenHuman's connection pass does not prove tool-use, desktop control,
workflow reliability or the advertised token savings. Its RPC dotted method name also failed; the documented direct
namespace command worked. A future agent trial needs to resolve the hosted-authority setup first, without importing
another agent's credentials automatically.

**Hardware caveat:** the runtime reported size_vram=0 and used its CPU backend; no NVIDIA GPU was discovered in
this session. NVIDIA-SMI refused access for insufficient permissions. No drivers, services, ACLs or global model
settings were changed. These times are not representative of Claude's earlier RTX 4090/GPU measurements. Restoring
and verifying GPU inference in the actual user session is a useful separate setup task before judging local speed.

## Context changes delivered

The old broad startup list totals **418,942 bytes** across nine documents (most of it history, coordination and
backlog). That figure is a document footprint, not a billed-token count. A named-task packet was **7,630 characters**;
actual Ollama token accounting for its lookup measured 2,126 prompt tokens. The legacy comparison used a bounded
excerpt, not all 419 KB, and timed out; therefore no exact paid-token saving or speedup percentage is claimed.

- AGENTS.md is the shared, short set of stable rules. CLAUDE.md routes into it rather than demanding nine full reads.
- docs/AI-START.md tells an agent which sections to open for planning, code, story, assets, review or history.
- tools/agent-context.cjs reads current QUEUE/COMMS locally and returns only named rows, recent/task coordination,
  freshness fingerprints and scoped pointers. It makes no model/network call and does not claim or select work.
- Long/omitted messages get explicit pointers/warnings; over-budget output fails. Expired cycles are flagged.
- Old root instructions are preserved byte-for-byte in docs/archive. START-HERE history remains searchable; its
  entry prompt now uses the scoped route. No planning status/version paragraphs were rewritten.
- The routing regression suite joins normal CI; it checks continuation-row ownership, stale cycles, malformed
  input, budgets, long-message warnings and freshness after source changes.

Run: `node tools/agent-context.cjs --agent Codex --task DM-N1c --project diamond-manager`.
For machine integration add `--json`. Rebuild on branch/task/source changes, then check live PR ownership and read
the actual ticket/source/tests. A summary is an index, never proof of merge/publication or permission to bypass rules.

## Candidate sources and limits

- [OpenHuman](https://github.com/tinyhumansai/openhuman), pinned release v0.64.15, SHA-256 verified before extracting.
  [Local runtime guide](https://tinyhumans.gitbook.io/openhuman/features/model-routing/local-ai) and
  [privacy mode](https://tinyhumans.gitbook.io/openhuman/features/privacy-and-security/privacy-mode): local routes
  are explicit and voice remains a separate cloud concern. Only headless text inference was tested; no desktop
  automation, subscriptions or accounts were enabled.
- [Free LLM API directory](https://github.com/mnfst/awesome-free-llm-apis) is a provider catalogue, not a runtime or
  a token-limit bypass. [Gemini pricing](https://ai.google.dev/gemini-api/docs/pricing) and
  [Groq limits](https://console.groq.com/docs/rate-limits) require checking the chosen account/model's actual quota
  and data terms. No provider API keys were configured for this comparison.

Machine-readable evidence and exact prompts/fixtures: [results.json](agent-efficiency-2026-10-13/results.json).
The extracted app and raw local logs stay in the temporary evaluation folder outside Git; no binary/model weights
were added to the repository. No paid inference or image credits were spent.
