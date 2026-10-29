# Vogue prototype

Static HTML, CSS, and JavaScript prototype. The root URL opens the image-based Links Menu. From there, choose one of the three existing Today experiences or Style Me 1.0, 2.0, or 3.0.

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

The Today screenshots include clickable article and This Week at Vogue regions. Breaking News opens over the selected Today image; article and video overlays retain their existing interactions.

Style Me previews:

- Editorialised Grids: <http://localhost:8000/style-me-preview.html?version=1>
- Editorialised Carousels: <http://localhost:8000/style-me-preview.html?version=2>
- Style Me 3.0: <http://localhost:8000/style-me-v3.html>

Style Me 3.0 uses the local `Style Me 3.0/STYLE ME 3.0` exports. The upper portion of a Discover More Edits card changes its editorial section; the lower portion opens the PLP. The PLP preserves landing-page state and scroll position, and closes with Back or a new continued scroll gesture at its end. Four Wishlist tabs navigate four sections by repeating the two supplied editor PNGs, while What to Wear keeps its transparent navigation and footer stationary. Red indicators fade twice on first entry. Motion respects reduced-motion preferences. The Bags caption reuses PNG lettering; no new webfont is published. The pre-3.0 checkpoint is `bc65add`.

The previous Shopping URL, <http://localhost:8000/index.html?tab=shopping>, opens Style Me 1.0. Tap the Vogue logo to return to the Links Menu, Home to open Today, or Shopping to return to the top. Category shortcuts jump to the relevant edit or Continue Exploring. Collection and Discover retain their existing placeholder behavior.

Both versions display unchanged exports from `New Style Me Prototypes/STYLEME`. The body image is displayed in clipped sections, replacing the carousel regions with the supplied PNGs. All dimensions scale from the 375px design. Swipe the announcements, stories, and Continue Exploring; Style Me 2.0 also has the wide What Vogue Wears strip. Under $300 is a continuous native product rail that repeats the three editorial groups in both directions. Its label and pagination follow the group at the centre of the viewport. Swiping the grey label or selecting a dot jumps to that group’s beginning. The Wishlist has four swipeable states, using the original export first and existing project imagery for the additional grids. What Vogue Wears gently aligns near The Cold Weather Shop and Knitwear after scrolling settles. Stories retains its original image-based controls. Mouse dragging and horizontal trackpad scrolling are also supported.

Local checkpoint before the replacement: `f2f8a5f`.

The Adobe Garamond Pro stylesheet is served by Adobe and requires a network connection. Local Vogue Avant Garde and Didot font binaries load in the local preview but are excluded from Git pending confirmation of web-embedding permission. A published copy would use CSS fallbacks for those families unless permission is confirmed and the fonts are intentionally included.

## Publishing

All app asset URLs are relative to the project root, so the prototype can be hosted as a static site, including at a GitHub Pages project path. GitHub Pages publishes from the existing `main` branch at <https://moisesnevett-lab.github.io/vogue-shopping-prototype/>. Keep this repository, branch, and URL unchanged when publishing updates.
