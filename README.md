# Vogue Shopping prototype

Static HTML, CSS, and JavaScript prototype. The main entry point is `index.html`.

## Run locally

From this directory, start a static server:

```sh
python3 -m http.server 8000
```

Open <http://localhost:8000/>.

The Adobe Garamond Pro stylesheet is served by Adobe and requires a network connection. Local Vogue Avant Garde and Didot font binaries are intentionally excluded pending confirmation of web-embedding permission; those families use the CSS fallback fonts until permission is confirmed.

## Publishing

All app asset URLs are relative to the project root, so the prototype can be hosted as a static site, including at a GitHub Pages project path. GitHub Pages is not enabled; obtain approval before enabling public hosting.
