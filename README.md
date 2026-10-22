# Vogue prototype

Static HTML, CSS, and JavaScript prototype. The root URL opens the image-based Links Menu. From there, choose one of the Today screenshot experiences or open the existing Shopping / Style Me app.

## Run locally

From this directory, start a static server:

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000/>.

The image-based Today preview can also be opened directly:

- Collapsed: <http://localhost:8000/today-image-preview.html?view=collapsed>
- Expanded: <http://localhost:8000/today-image-preview.html?view=expanded>
- Coming Soon: <http://localhost:8000/today-image-preview.html?view=coming-soon>
- Editor Explains: <http://localhost:8000/today-image-preview.html?view=editor-explains>

The Today screenshots include clickable article and This Week at Vogue regions. Breaking News opens over the selected Today image; article and video overlays retain their existing interactions. Shopping remains available at <http://localhost:8000/index.html?tab=shopping>.

The Adobe Garamond Pro stylesheet is served by Adobe and requires a network connection. Local Vogue Avant Garde and Didot font binaries load in the local preview but are excluded from Git pending confirmation of web-embedding permission. A published copy would use CSS fallbacks for those families unless permission is confirmed and the fonts are intentionally included.

## Publishing

All app asset URLs are relative to the project root, so the prototype can be hosted as a static site, including at a GitHub Pages project path. GitHub Pages is not enabled; obtain approval before enabling public hosting.
