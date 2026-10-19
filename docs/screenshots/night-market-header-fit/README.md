# Night Market header fit

The production change is one CSS grid-ratio replacement in `games/night-market/style.css`: `0.9fr / 1.1fr` becomes `1fr / 1fr` on short landscape phones. No test assertion changes.

| View | Before | After |
|---|---|---|
| Narrow landscape, 25 coins | [568×320](before-568x320.png) | [568×320](after-568x320.png) |
| Portrait | [390×844](before-390x844.png) | [390×844](after-390x844.png) |
| Landscape | [844×390](before-844x390.png) | [844×390](after-844x390.png) |
| Laptop | [1366×768](before-1366x768.png) | [1366×768](after-1366x768.png) |
| Ultrawide | [3440×1440](before-3440x1440.png) | [3440×1440](after-3440x1440.png) |
| Enlarged text | [390×844 at 200%](before-390x844-large-text.png) | [390×844 at 200%](after-390x844-large-text.png) |

Measured element boxes: [before.json](before.json), [after.json](after.json). At 568×320, the Back centre and cash centre now both sit at y=111.59375. Cash remains at the same vertical centre on 844×390, and 200% text still places cash below Back. There is no horizontal overflow at any captured size.

Reproduce from the repository root with Playwright and Chrome available:

```powershell
node docs/screenshots/night-market-header-fit/capture.cjs after
node tools/run-all-checks.cjs night-market
```

The capture uses a fresh browser context and synthetic 25-cup/25-coin state. It does not read player saves. Captures were made from the corresponding working CSS before its implementation commit; the images and measured boxes are retained unchanged. Existing checks perform real clicks/holds, hiring, reload and save isolation; the capture script supplies geometry and pictures.
