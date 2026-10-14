# Contributing to Generations (for guests and their AI helpers)

Welcome. Generations is Evan's set of games, built by Evan with several AI assistants. This page is for anyone outside
that group who wants to help, for example a family member working with their own AI (ChatGPT, Claude, Gemini or
another). You don't need to know how to program: your AI does the work, and this page tells it the rules.

## 1. Get set up (once)

1. Make a free GitHub account at github.com if you don't have one, and tell Evan your GitHub name.
2. Evan invites you as a **collaborator** (Evan: on GitHub, the repo's Settings, Collaborators, Add people, type the
   name). Accept the invitation from the email GitHub sends, or at https://github.com/notifications.
3. Give your AI access to the repo. It works on its own **branch** (`guest/<topic>`), never on `main`, so nothing it
   does reaches the games until a pull request is reviewed and merged.
   (Without an invitation you can still help: press **Fork** on the repo page and work in your own copy.)

## 2. Paste this to your AI to start every session

```
You are helping with github.com/ecbarish/generations as a guest contributor (lane X).
Your task this week is in docs/QUEUE.md "This cycle" (find your AI's name); do that first and nothing else.
Read, in this order: CONTRIBUTING.md, docs/STUDIO-PLAN.md, docs/PROCESS.md (how to claim, submit and merge), docs/GOALS.md (where each game
is heading), START-HERE.md,
docs/PRIORITIES.md, docs/QUEUE.md ("This cycle" and "Who works where"), docs/CREATIVE.md and docs/COMMS.md.
You can use docs/COMMS.md to communicate with the other AIs. Add a short message at the top (newest first) when you
need something, hand work over, or learn something they should know. Do not edit or delete their messages.
Follow docs/PROCESS.md exactly: take your task from "This cycle", claim it with a draft pull request from a branch named
guest/<topic> before building, keep to the task's files, run its checks, mark the pull request ready, do the self-check,
and leave the merge to Generations Reviewer (PROCESS.md "Who merges"). When your task is done, follow the spare-effort order in "This cycle". Never push to main and never touch files outside your task.
Explain everything to me in plain words; I'm not a programmer.
```

## 3. How your work reaches the games

1. Your AI builds the task on a branch named `guest/<topic>`.
2. It opens a **pull request** to `ecbarish/generations` `main`. The pull request is how Evan's side sees the work.
3. GitHub runs the automatic checks (a green tick means they passed).
4. When it's ready, your AI goes through the self-check in docs/PROCESS.md and writes it as a comment. Then it waits:
   **Only Generations Reviewer merges** (Evan, 2026-10-14). Nobody merges their own pull request, and that includes guests (outside AIs such as Adam's, or Evan's other accounts). Generations Reviewer reviews and merges.
5. Once merged, the change is live at https://ecbarish.github.io/generations/ within a few minutes.

## 4. The few rules that matter

- **One task per pull request**, small and playable. Say which files you changed.
- **Old saves must keep loading.** Players' progress is never lost.
- **Everything happens in the game window** and is written for players (docs/CREATIVE.md "Writing for players").
- **Outside art, sound or music** only with a license that allows it, recorded in CREDITS.md.
- **Your own name and email** on your commits (GitHub's private "noreply" email is fine: GitHub, Settings, Emails).
- **No passwords, keys or personal details** in anything you commit.
- **New ideas are welcome** as GitHub issues (the "Suggestion" form) or a line in docs/ideas.md; Evan decides what
  gets built (docs/PRIORITIES.md).
- **Talk to the other AIs in docs/COMMS.md.** Add your note at the top. Never change or delete someone else's message.
- **Questions:** open a GitHub issue, ask on docs/COMMS.md, or ask Evan.
