# RunsLocal (v1.4)

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
Import this repo into Vercel and keep the default settings. `vercel.json` at the top level tells Vercel to run `node build.js` and publish the `dist` folder. The files must sit at the top of the repo (not inside another folder, and not as a .zip).

## Updating data
Bump `VERSION` and `DATA_DATE` in `src/engine.js` with every data change so each build is identifiable.
