// RunsLocal static site builder — v1.4
// Usage: node build.js            → writes dist/ (deploy to Vercel) and artifact/ (preview)
// Change SITE when the domain is final; everything (canonicals, sitemap, llms.txt) follows it.
const fs = require("fs");
const path = require("path");
const RL = require("./src/engine.js");

const SITE = process.env.SITE || "https://runslocal.netlify.app";
const BRAND = "RunsLocal";
const CSS = fs.readFileSync("src/style.css", "utf8");
const ENGINE = fs.readFileSync("src/engine.js", "utf8");
const DEF = { ram: 32, ramBw: 70, ctx: 8192 }; // assumptions for static pages
const FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap">`;
const prosTps = t => t >= 150 ? "over 150" : "about " + RL.fmtTps(t);
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const gpus = RL.flat.filter(h => h[3] !== "c");
const gpuFile = h => `gpu/${RL.slug(h[0])}.html`;
const modelFile = m => `model/${RL.slug(m[0])}.html`;
const clean = f => f.replace(/\.html$/, "");
const memLabel = h => h[3] === "u" ? `${h[1]} GB unified memory` : `${h[1]} GB of VRAM`;

function head({ title, desc, url, ld }) {
  return `<title>${esc(title)}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><meta property="og:type" content="website"><meta name="twitter:card" content="summary">
${FONTS}
${ld ? `<script type="application/ld+json">${JSON.stringify(ld)}</script>` : ""}
<style>${CSS}</style>`;
}
const fullDoc = (h, body) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${h}
</head><body>${body}</body></html>
`;
const topbar = (rootRel) => `<header class="top"><a class="brand" href="${rootRel}index.html" style="text-decoration:none;color:inherit">Runs<b>Local</b></a><span class="ver">${RL.VERSION} · data ${RL.DATA_DATE}</span></header>`;
const footer = `<footer><span>${BRAND} ${RL.VERSION} · Model list updated ${RL.DATA_DATE}</span><span>Estimates only. Not affiliated with any GPU or model maker.</span></footer>`;
const faq = qa => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: qa.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) });

// ---------- GPU pages ----------
function gpuPage(h) {
  const rows = RL.rank(h, DEF.ram, DEF.ramBw, DEF.ctx);
  const runs = rows.filter(x => ["gpu", "squeeze"].includes(x.r.tier));
  const full = rows.filter(x => x.r.tier === "gpu");
  const off = rows.filter(x => x.r.tier === "off");
  const best = full.slice().sort((a, b) => b.m[1] - a.m[1]).slice(0, 3);
  const fast = full.slice(0, 2);
  const ramNote = h[3] === "d" ? `, assuming ${DEF.ram} GB of DDR5 system RAM` : "";
  let answer = `With ${memLabel(h)}, the ${h[0]} runs ${full.length} of ${RL.MODELS.length} popular open models fully in fast memory at Q4_K_M or better (8K context${ramNote}).`;
  if (best.length) answer += ` The largest that fit are ${best.map(x => `${x.m[0]} (${x.r.q})`).join(", ")}.`;
  if (fast.length) answer += ` Fastest: ${fast.map(x => `${x.m[0]} at ${prosTps(x.r.tps)} tokens/sec`).join(" and ")}.`;
  if (off.length) answer += ` ${off.length} more ${off.length === 1 ? "runs" : "run"} with offload to system RAM, but slower.`;
  const title = `What AI models can the ${h[0]} run? | ${BRAND}`;
  const url = `${SITE}/${clean(gpuFile(h))}`;
  const body = `<div class="wrap">${topbar("../")}
<p class="crumb"><a href="../index.html">All hardware</a> / ${esc(h[0])}</p>
<h1>What AI models can the ${esc(h[0])} run?</h1>
<p class="answer">${esc(answer)}</p>
<a class="cta" href="../index.html">Check with your own RAM and context length</a>
<div class="tablewrap"><table class="ref"><thead><tr><th>Model</th><th>Result</th><th>Best quant</th><th>Memory needed</th><th>Est. speed</th></tr></thead><tbody>
${rows.map(({ m, r }) => `<tr><td><a href="../${modelFile(m)}">${esc(m[0])}</a><br><span class="meta">${esc(m[4])}</span></td><td><span class="tag ${RL.TIER[r.tier][1]}">${RL.TIER[r.tier][0]}</span></td><td class="num">${r.q}</td><td class="num">${r.need.toFixed(1)} GB</td><td class="num">${r.tps ? RL.fmtTps(r.tps) + " tok/s" : "—"}</td></tr>`).join("\n")}
</tbody></table></div>
<p class="meta">Specs used: ${memLabel(h)}, ${h[2]} GB/s memory bandwidth. Speeds are estimates for generating text with llama.cpp-style runtimes; real numbers usually land within about 20%.</p>
${footer}</div>`;
  const desc = answer.slice(0, 300);
  return fullDoc(head({ title, desc, url, ld: faq([[`What AI models can the ${h[0]} run?`, answer]]) }), body);
}

// ---------- Model pages ----------
function modelPage(m) {
  const kv = m[3];
  const quantRows = RL.QUANTS.map(([q, b]) => [q, m[1] * b / 8 + kv + RL.OVERHEAD]);
  const res = gpus.map(h => ({ h, r: RL.evaluate(m, h, DEF.ram, DEF.ramBw, DEF.ctx) }));
  const full = res.filter(x => x.r.tier === "gpu").sort((a, b) => a.h[1] - b.h[1] || b.r.tps - a.r.tps);
  const off = res.filter(x => x.r.tier === "off").sort((a, b) => b.r.tps - a.r.tps);
  const q4 = quantRows[3][1];
  const moe = m[1] !== m[2];
  const cheapest = full.filter(x => x.h[3] === "d").sort((a, b) => a.h[1] - b.h[1] || a.h[2] - b.h[2])[0];
  let answer = `${m[0]} has ${m[1]}B parameters${moe ? ` (${m[2]}B active per token, mixture-of-experts)` : ""}. At Q4_K_M with 8K context it needs about ${q4.toFixed(1)} GB of memory.`;
  if (cheapest) answer += ` The smallest graphics card that runs it fully on the GPU is about ${cheapest.h[1]} GB, such as the ${cheapest.h[0]}.`;
  else if (full.length) answer += ` It needs a large unified-memory machine such as the ${full[0].h[0]}, or a multi-GPU setup.`;
  else answer += ` It is too large for any single consumer card or Mac in our list at Q4; it needs a multi-GPU server.`;
  if (moe && off.length) answer += ` Because only ${m[2]}B parameters are active, it still runs usably with offload to system RAM on cards like the ${off[0].h[0]}.`;
  const title = `What GPU do I need to run ${m[0]}? | ${BRAND}`;
  const url = `${SITE}/${clean(modelFile(m))}`;
  const body = `<div class="wrap">${topbar("../")}
<p class="crumb"><a href="../index.html">All models</a> / ${esc(m[0])}</p>
<h1>What GPU do I need to run ${esc(m[0])}?</h1>
<p class="answer">${esc(answer)}</p>
<a class="cta" href="../index.html">Check your own hardware</a>
<h2 class="sec">Memory by quantization (8K context)</h2>
<div class="tablewrap"><table class="ref"><thead><tr><th>Quant</th><th>Bits per weight</th><th>Memory needed</th></tr></thead><tbody>
${quantRows.map(([q, n], i) => `<tr><td class="num">${q}</td><td class="num">${RL.QUANTS[i][1]}</td><td class="num">${n.toFixed(1)} GB</td></tr>`).join("\n")}
</tbody></table></div>
<h2 class="sec">Hardware that runs it fully in fast memory</h2>
${full.length ? `<div class="tablewrap"><table class="ref"><thead><tr><th>Hardware</th><th>Memory</th><th>Best quant</th><th>Est. speed</th></tr></thead><tbody>
${full.map(({ h, r }) => `<tr><td><a href="../${gpuFile(h)}">${esc(h[0])}</a></td><td class="num">${h[1]} GB</td><td class="num">${r.q}</td><td class="num">${RL.fmtTps(r.tps)} tok/s</td></tr>`).join("\n")}
</tbody></table></div>` : `<p class="meta">None of the single cards or machines in our list hold it at Q4_K_M or better.</p>`}
${off.length ? `<h2 class="sec">Runs with offload to system RAM (slower)</h2>
<p class="links">${off.slice(0, 24).map(({ h, r }) => `<a href="../${gpuFile(h)}">${esc(h[0])}</a> <span class="meta">~${RL.fmtTps(r.tps)} tok/s</span>`).join(" · ")}</p>` : ""}
<p class="meta">Assumes ${DEF.ram} GB of DDR5 system RAM for offload. Estimates only; real speeds usually land within about 20%.</p>
${footer}</div>`;
  return fullDoc(head({ title, desc: answer.slice(0, 300), url, ld: faq([[`What GPU do I need to run ${m[0]}?`, answer]]) }), body);
}

// ---------- Home / tool ----------
function browseLinks() {
  const byGroup = RL.HW.filter(([g]) => g !== "No GPU").map(([g, list]) => `<div class="grp">${esc(g)}</div><div class="links">${list.map(h => `<a href="${gpuFile(h)}">${esc(h[0])}</a>`).join("")}</div>`).join("");
  return `<section class="browse"><h2>What can my GPU run?</h2>${byGroup}</section>
<section class="browse"><h2>What do I need to run a model?</h2><div class="links">${RL.MODELS.map(m => `<a href="${modelFile(m)}">${esc(m[0])}</a>`).join("")}</div></section>`;
}
function homeBody() {
  const tool = fs.readFileSync("src/home.body.html", "utf8");
  return tool.replace("<!--BROWSE-->", browseLinks()).replace("/*__ENGINE__*/", ENGINE).replaceAll("{{VERSION}}", RL.VERSION).replaceAll("{{DATA_DATE}}", RL.DATA_DATE);
}
const homeFaq = [
  ["How much VRAM do I need to run a local LLM?", "At the common Q4_K_M quantization a model needs about 0.6 GB per billion parameters, plus room for the context (KV cache) and about 0.5 GB of runtime overhead. A 9B model fits in 8 GB, 27B-31B models need about 20 GB, and a 70B model needs about 45 GB."],
  ["What is the best local AI model for a 16 GB GPU?", "Qwen3.6 35B-A3B and Gemma 4 26B A4B run well with light offload because they are mixture-of-experts models. Gemma 4 12B fits fully on the GPU at Q8."],
  ["What is the best local AI model for a 24 GB GPU like the RTX 3090 or 4090?", "Qwen3.8 27B, Gemma 4 31B and Qwen3.6 27B at Q4_K_M, with room for 8K-32K of context."],
  ["Can I run a model bigger than my VRAM?", "Yes. llama.cpp and Ollama can offload part of the model to system RAM. The part in RAM runs at RAM speed, so generation slows down. Mixture-of-experts models handle offload far better than dense models."],
  ["How fast will a local model run?", "Generation speed is limited by memory bandwidth: tokens per second is roughly usable bandwidth divided by the size of the active weights."]
];
function homeHead() {
  return head({ title: `${BRAND} · Can my PC run this AI model?`, desc: "Pick your GPU or Mac and see which open AI models (Qwen3.8, Gemma 4, gpt-oss, DeepSeek, Llama) fit in your memory, at what quantization, and about how fast they'll run.", url: SITE + "/", ld: faq(homeFaq) })
    .replace(/<title>.*?<\/title>/, `<title>${BRAND}</title>`);
}

// ---------- llms.txt, sitemap, robots ----------
function llmsTxt() {
  const lines = [`# ${BRAND}`, "", `> ${BRAND} answers "Can my PC run this AI model?" It estimates which open-weight LLMs fit on a given GPU or Mac, the best quantization, memory needed, and generation speed. Data updated ${RL.DATA_DATE}.`, "",
    "## Method", "- Memory needed = parameters x bits-per-weight / 8 + KV cache + 0.5 GB overhead.", "- Speed (tokens/sec) ~= 0.6 x memory bandwidth / active weight size. Mixture-of-experts models only read active parameters.", "- Unified memory (Mac, Ryzen AI Max, DGX Spark): ~72% of RAM usable. Discrete GPUs: VRAM minus 0.6 GB.", `- Static pages assume ${DEF.ram} GB DDR5 RAM and 8K context.`, "",
    "## Quick answers by GPU (largest models that run fully on the GPU at Q4_K_M or better)"];
  gpus.forEach(h => {
    const full = RL.rank(h, DEF.ram, DEF.ramBw, DEF.ctx).filter(x => x.r.tier === "gpu").sort((a, b) => b.m[1] - a.m[1]).slice(0, 3);
    lines.push(`- [${h[0]}](${SITE}/${clean(gpuFile(h))}) (${h[1]} GB): ${full.length ? full.map(x => `${x.m[0]} ${x.r.q} ~${RL.fmtTps(x.r.tps)} tok/s`).join("; ") : "small models only, see page"}`);
  });
  lines.push("", "## Models");
  RL.MODELS.forEach(m => lines.push(`- [${m[0]}](${SITE}/${clean(modelFile(m))}): ${m[1]}B params${m[1] !== m[2] ? `, ${m[2]}B active` : ""}; Q4_K_M needs ~${(m[1] * 4.85 / 8 + m[3] + RL.OVERHEAD).toFixed(1)} GB at 8K context`));
  return lines.join("\n") + "\n";
}

// ---------- write ----------
function write(dir, rel, content) { const p = path.join(dir, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); }
for (const d of ["dist", "artifact"]) fs.rmSync(d, { recursive: true, force: true });
const pages = [];
write("dist", "index.html", fullDoc(homeHead(), homeBody()));
write("artifact", "index.html", homeHead() + "\n" + homeBody());
gpus.forEach(h => { const f = gpuFile(h), html = gpuPage(h); write("dist", f, html); write("artifact", f, html); pages.push(f); });
RL.MODELS.forEach(m => { const f = modelFile(m), html = modelPage(m); write("dist", f, html); write("artifact", f, html); pages.push(f); });
const today = new Date().toISOString().slice(0, 10);
write("dist", "sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>${SITE}/</loc><lastmod>${today}</lastmod></url>\n${pages.map(f => `<url><loc>${SITE}/${clean(f)}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`);
write("dist", "robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
write("dist", "llms.txt", llmsTxt());
console.log(`Built ${RL.VERSION}: 1 home + ${gpus.length} GPU pages + ${RL.MODELS.length} model pages for ${SITE}`);
