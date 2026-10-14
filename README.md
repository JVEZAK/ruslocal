# RunsLocal (v1.8)

"Can my PC run this AI model?" Pick a GPU or Mac and see which open models fit, at what quantization, and how fast.

## Layout
- `src/engine.js`: all hardware and model data plus the fit and speed math. Edit this to add a model or GPU.
- `src/home.body.html`: the interactive checker page.
- `src/style.css`: shared styles.
- `build.js`: generates the static site into `dist/`.

## Build
```
SITE=https://yourdomain.com node build.js
```
This writes `dist/` with the home page, one page per GPU (`/gpu/rtx-4070`), one page per model (`/model/gemma-4-31b`), plus `sitemap.xml`, `robots.txt` and `llms.txt` (for AI chatbots).

## Deploy
Hosted on Netlify (project `runslocal`, https://runslocalai.com). `netlify.toml` tells Netlify to run `node build.js` and publish `dist/`, so every push to `main` goes live automatically once the repo is linked in Netlify. `vercel.json` does the same for Vercel if the site ever moves there.

## Updating data
Bump `VERSION` and `DATA_DATE` in `src/engine.js` with every data change so each build is identifiable.
