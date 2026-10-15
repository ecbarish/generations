# LR-TOY-POLISH: kitchen bowl, picture signs, missing icon

Captured 2026-10-15 from this branch in headless Chrome, with sound off. Each picture is the whole game window.

The ranch shots show the picture signs. The kitchen shots are the moment a berry has landed: it sits in the blue bowl, the bowl has bounced, and a pale ring marks the landing. Before this change the berry was drawn underneath the bowl, so the bowl looked empty.

| Size | Ranch | Kitchen, food in the bowl |
|---|---|---|
| 1024×594 | [ranch-1024x594.png](ranch-1024x594.png) | [kitchen-1024x594.png](kitchen-1024x594.png) |
| 390×844 | [ranch-390x844.png](ranch-390x844.png) | [kitchen-390x844.png](kitchen-390x844.png) |
| 844×390 | [ranch-844x390.png](ranch-844x390.png) | [kitchen-844x390.png](kitchen-844x390.png) |

On each of those loads the only icon request was `icons/arcade.svg`, which returned 200. There was no request for `favicon.ico`.
