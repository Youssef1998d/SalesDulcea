// East Blue base tokens — platform-level, never change
export const EB = {
  bg:        "#0a1628",
  surface:   "#0f2347",
  surfaceHi: "#162d5a",
  border:    "#1a3a6b",
  gold:      "#f0c040",
  goldDim:   "#b8922a",
  text:      "#e8f4ff",
  textSub:   "#7eb8f7",
  textDim:   "#3a5a8a",
  success:   "#34d399",
  warning:   "#fbbf24",
  danger:    "#f87171",
  info:      "#60a5fa",
};

// Inject global styles and fonts once
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap";
document.head.appendChild(fontLink);

const style = document.createElement("style");
style.textContent = `
  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  body { margin: 0; background: ${EB.bg}; }
  input, select, textarea, button { font-family: 'Inter', sans-serif; }
  input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: ${EB.bg}; }
  ::-webkit-scrollbar-thumb { background: ${EB.border}; border-radius: 4px; }
  @keyframes wave {
    0%,100% { transform: scaleX(0.6) translateX(-10px); opacity: 0.4; }
    50%      { transform: scaleX(1) translateX(0); opacity: 1; }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
  .eb-card { animation: fadeUp 0.2s ease forwards; }
  .eb-btn:active { transform: scale(0.97); }
`;
document.head.appendChild(style);
