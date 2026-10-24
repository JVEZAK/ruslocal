// RunsLocal engine — shared by the live tool (browser) and the static page builder (Node).
// v2.9 · data Oct 24, 2026
(function (root) {
  const VERSION = "v2.9";
  const DATA_DATE = "Oct 24, 2026";

  // Hardware: name, memory GB, bandwidth GB/s, kind (d = discrete GPU, u = unified memory, c = CPU only)
  const HW = [
    ["NVIDIA", [
      ["RTX 5090", 32, 1792, "d"], ["RTX 5080", 16, 960, "d"], ["RTX 5070 Ti", 16, 896, "d"], ["RTX 5070", 12, 672, "d"],
      ["RTX 5060 Ti 16GB", 16, 448, "d"], ["RTX 5060 Ti 8GB", 8, 448, "d"], ["RTX 5060", 8, 448, "d"], ["RTX 5050", 8, 320, "d"],
      ["RTX 4090", 24, 1008, "d"], ["RTX 4080 Super", 16, 736, "d"], ["RTX 4080", 16, 717, "d"], ["RTX 4070 Ti Super", 16, 672, "d"],
      ["RTX 4070 Ti", 12, 504, "d"], ["RTX 4070 Super", 12, 504, "d"], ["RTX 4070", 12, 504, "d"], ["RTX 4060 Ti 16GB", 16, 288, "d"],
      ["RTX 4060 Ti 8GB", 8, 288, "d"], ["RTX 4060", 8, 272, "d"],
      ["RTX 3090 Ti", 24, 1008, "d"], ["RTX 3090", 24, 936, "d"], ["RTX 3080 Ti", 12, 912, "d"], ["RTX 3080 12GB", 12, 912, "d"],
      ["RTX 3080 10GB", 10, 760, "d"], ["RTX 3070", 8, 448, "d"], ["RTX 3060 Ti", 8, 448, "d"], ["RTX 3060 12GB", 12, 360, "d"],
      ["RTX 2080 Ti", 11, 616, "d"], ["RTX PRO 6000 Blackwell", 96, 1792, "d"], ["DGX Spark 128GB", 128, 273, "u"], ["DGX Spark 64GB", 64, 273, "u"], ["RTX Spark 128GB", 128, 301, "u"]]],
    ["AMD", [
      ["RX 9070 XT", 16, 640, "d"], ["RX 9070", 16, 640, "d"], ["RX 9060 XT 16GB", 16, 320, "d"], ["RX 7900 XTX", 24, 960, "d"],
      ["RX 7900 XT", 20, 800, "d"], ["RX 7800 XT", 16, 624, "d"], ["RX 7700 XT", 12, 432, "d"], ["RX 7600", 8, 288, "d"], ["RX 6800 XT", 16, 512, "d"],
      ["Ryzen AI Max+ 395 128GB", 128, 256, "u"], ["Ryzen AI Max+ 395 64GB", 64, 256, "u"]]],
    ["Intel", [["Arc Pro B70 32GB", 32, 608, "d"], ["Arc B580", 12, 456, "d"], ["Arc A770 16GB", 16, 560, "d"]]],
    ["Apple (unified memory)", [
      ["M3 Ultra 512GB", 512, 819, "u"], ["M3 Ultra 256GB", 256, 819, "u"], ["M3 Ultra 96GB", 96, 819, "u"],
      ["M5 Max 128GB", 128, 614, "u"], ["M5 Max 64GB", 64, 614, "u"], ["M5 Max 36GB", 36, 460, "u"],
      ["M5 Pro 64GB", 64, 307, "u"], ["M5 Pro 24GB", 24, 307, "u"],
      ["M4 Max 128GB", 128, 546, "u"], ["M4 Max 64GB", 64, 546, "u"], ["M4 Max 36GB", 36, 410, "u"],
      ["M4 Pro 48GB", 48, 273, "u"], ["M4 Pro 24GB", 24, 273, "u"],
      ["M5 32GB", 32, 153, "u"], ["M5 16GB", 16, 153, "u"], ["M4 32GB", 32, 120, "u"], ["M4 16GB", 16, 120, "u"]]],
    ["No GPU", [["CPU only", 0, 0, "c"]]]
  ];

  // Models: name, total params B, active params B, KV cache GB per 8K tokens (fp16 estimate), tags, note
  const MODELS = [
    ["Qwen3.8 27B", 27.8, 27.8, 0.6, "coding", "Best single-GPU model (Aug 2026)"],
    ["Gemma 4 31B", 30.7, 30.7, 0.7, "general · vision", "Google's largest dense Gemma"],
    ["Gemma 4 26B A4B", 25.2, 3.8, 0.6, "MoE · vision", "Fast MoE, ~4B active"],
    ["Gemma 4 12B", 12, 12, 0.5, "general · audio", "Strong mid-size all-rounder"],
    ["Gemma 4 E4B", 8, 4.5, 0.3, "small · audio", "Laptop-class"],
    ["Gemma 4 E2B", 5.1, 2.3, 0.2, "small", "Phone and edge class"],
    ["Qwen3.6 35B-A3B", 35, 3, 0.5, "MoE · coding", "Agentic coder, ~3B active"],
    ["Qwen3.6 27B", 27, 27, 0.6, "coding", "Dense, strong at code"],
    ["Qwen3.5 9B", 9.7, 9.7, 0.5, "general", "Good 8 GB pick"],
    ["Qwen3.5 122B-A10B", 122, 10, 0.8, "MoE", "Workstation / big Mac class"],
    ["Qwen3.8-Flash-Next", 176, 6, 0.6, "MoE", "125B + n-gram table, 6B active"],
    ["Nemotron 3.5 Lightning 30B-A3B", 30, 3, 0.3, "MoE · agentic", "NVIDIA hybrid Mamba, ~3B active, 1M context"],
    ["gpt-oss-20b", 21, 3.6, 0.4, "MoE · reasoning", "OpenAI open-weight, Apache 2.0"],
    ["gpt-oss-120b", 117, 5.1, 0.6, "MoE · reasoning", "Needs ~64 GB+"],
    ["Phi-4 14B", 14.7, 14.7, 1.6, "reasoning", "Microsoft, 16K context"],
    ["Ministral 3 3B", 3.8, 3.8, 0.3, "small", "Tiny and quick"],
    ["Mistral Small 3.1 24B", 24, 24, 1.3, "general", "Reliable mid-size"],
    ["Granite 4.2 30B", 29.3, 29.3, 0.3, "general", "IBM hybrid, light cache"],
    ["Hermes 4.3 36B", 36.2, 36.2, 1.5, "general", "Nous Research"],
    ["Llama 3.3 70B", 70.6, 70.6, 2.6, "general", "Classic 70B"],
    ["Llama 4 Scout", 109, 17, 1.5, "MoE · vision", "17B active"],
    ["GLM-5.3-Flash", 320, 18, 1.5, "MoE · coding", "Strongest MIT-licensed mid model"],
    ["DeepSeek V4.1-Flash", 552, 16, 0.6, "MoE · coding", "Frontier open weights, 1M context"],
    ["Muse Spark Open 816B-A42B", 816, 42, 2.1, "MoE · vision", "Meta, Oct 2026; 42B active, 1M context"],
    ["Mellum2.1 12B-A2.5B Thinking", 12, 2.5, 0.1, "MoE · coding", "JetBrains coding agent model, Apache 2.0"],
    ["LFM2.5 24B-A2B", 24, 2.45, 0.2, "MoE · agentic", "Liquid AI hybrid conv/attention, Oct 2026; 131K context"],
    ["Reflection Beam 501B-A23B", 501, 23, 1.0, "MoE · coding", "Reflection AI, Oct 2026; Apache 2.0, agentic coding"],
    ["Nemotron 3.5 Bolt 74B-A9B", 74, 9, 0.4, "MoE · vision", "NVIDIA hybrid Mamba, Oct 2026; official 2-bit build is ~22 GB"],
    ["Nemotron 3.5 Super VL 120B-A12B", 120, 12, 0.6, "MoE · vision", "NVIDIA hybrid Mamba, Oct 2026; 1M context"],
    ["Kolibri-1 78B-A3.5B", 78.1, 3.46, 0.3, "MoE", "Aleph Alpha, Oct 2026; Apache 2.0, mostly sliding-window attention"],
    ["Step 5 Preview 600B-A27B", 600, 27, 1.0, "MoE · vision", "StepFun, Oct 2026; long-horizon agents, 1M context"],
    ["Jais 3 32B", 34.78, 34.78, 2.0, "general · Arabic", "MBZUAI/IFM, Oct 2026; Apache 2.0, Arabic-English, 512K context"],
    ["Jais 3 MoVA 36B-A4B", 37.44, 5.95, 1.0, "MoE · Arabic", "MBZUAI/IFM, Oct 2026; ~6B active, 512K context"],
    ["MiniMax M3.1 Flash 428B-A23B", 428, 23, 0.8, "MoE · vision", "MiniMax, weights Oct 23, 2026; ~23B active, 1M context, community license"],
    ["Recursive Flint 40B-A2.5B", 39.8, 2.5, 0.3, "MoE · coding", "Recursive, Oct 2026; Apache 2.0 local coding agent model, 262K context"]
  ];

  const QUANTS = [["Q8_0", 8.5], ["Q6_K", 6.56], ["Q5_K_M", 5.69], ["Q4_K_M", 4.85], ["Q3_K_M", 3.91], ["IQ2_M", 2.7]];
  const OVERHEAD = 0.5;

  const flat = [];
  HW.forEach(([, list]) => list.forEach(h => flat.push(h)));

  function slug(s) { return s.toLowerCase().replace(/\+/g, "-plus").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

  function usableMem(hw, ram) {
    if (hw[3] === "d") return Math.max(0, hw[1] - 0.6);
    if (hw[3] === "u") return hw[1] * 0.72;
    return Math.max(0, ram - 6) * 0.9;
  }

  function evaluate(m, hw, ram, ramBw, ctx) {
    const P = m[1], A = m[2], kv = m[3] * ctx / 8192;
    const kind = hw[3];
    const gpuMem = kind === "c" ? 0 : usableMem(hw, ram);
    const ramMem = (kind === "d" || kind === "c") ? Math.max(0, ram - 6) * 0.9 : 0;
    const gpuBw = kind === "c" ? ramBw : hw[2];
    const need = b => P * b / 8 + kv + OVERHEAD;
    const res = (tier, q, b, n, cap, frac) => {
      const act = A * b / 8; let tps = 0;
      if (tier === "gpu" || tier === "squeeze") tps = gpuBw * 0.6 / act;
      else if (tier === "cpu") tps = ramBw * 0.6 / act;
      else if (tier === "off") tps = 1 / (act * frac / (gpuBw * 0.6) + act * (1 - frac) / (ramBw * 0.6));
      return { tier, q, need: n, cap, tps };
    };
    const pool = kind === "c" ? ramMem : gpuMem;
    for (const [qn, b] of QUANTS.slice(0, 4)) if (need(b) <= pool) return res(kind === "c" ? "cpu" : "gpu", qn, b, need(b), pool, 1);
    // Order when Q4 doesn't fit on the GPU (v1.3):
    // MoE models offload well, so Q4 + offload beats a low-bit squeeze. Dense models
    // prefer Q3 on the GPU, then Q4 + offload, and only then IQ2 as a last resort.
    const b4 = 4.85, n4 = need(b4);
    const canOff = kind === "d" && n4 <= gpuMem + ramMem;
    const offload = () => res("off", "Q4_K_M", b4, n4, gpuMem, Math.min(1, gpuMem / n4));
    const moe = A < P * 0.5;
    if (canOff && moe) return offload();
    if (kind !== "c" && need(3.91) <= gpuMem) return res("squeeze", "Q3_K_M", 3.91, need(3.91), gpuMem, 1);
    if (canOff) return offload();
    if (kind !== "c" && need(2.7) <= gpuMem) return res("squeeze", "IQ2_M", 2.7, need(2.7), gpuMem, 1);
    return res("no", "Q4_K_M", b4, n4, pool, 0);
  }

  const TIER = { gpu: ["Runs on GPU", "t-gpu"], cpu: ["Runs on CPU", "t-squeeze"], squeeze: ["Lower quality fit", "t-squeeze"], off: ["Needs offload", "t-off"], no: ["Too big", "t-no"] };
  const ORDER = { gpu: 0, cpu: 1, squeeze: 2, off: 2, no: 4 };
  function fmtTps(t) { if (!t) return "—"; if (t >= 150) return "150+"; return t >= 10 ? String(Math.round(t)) : t.toFixed(1); }
  function speedWord(t) { if (!t) return "won't load"; if (t >= 30) return "fast"; if (t >= 10) return "usable"; if (t >= 3) return "slow"; return "crawl"; }
  function rank(hw, ram, ramBw, ctx) {
    return MODELS.map(m => ({ m, r: evaluate(m, hw, ram, ramBw, ctx) }))
      .sort((a, b) => ORDER[a.r.tier] - ORDER[b.r.tier] || b.r.tps - a.r.tps || a.m[1] - b.m[1]);
  }

  const RL = { VERSION, DATA_DATE, HW, MODELS, QUANTS, OVERHEAD, flat, slug, usableMem, evaluate, TIER, ORDER, fmtTps, speedWord, rank };
  root.RL = RL;
  if (typeof module !== "undefined") module.exports = RL;
})(typeof window !== "undefined" ? window : globalThis);
