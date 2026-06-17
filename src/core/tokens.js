// East Blue dark base tokens
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

// Inject Google Fonts once
const fontLink = document.createElement("link");
fontLink.rel  = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&display=swap";
document.head.appendChild(fontLink);

const style = document.createElement("style");
style.textContent = `
  *, *::before, *::after { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  html, body { margin: 0; padding: 0; min-height: 100%; }
  body { background: #0a1628; font-family: 'Inter', sans-serif; }
  input, select, textarea, button { font-family: 'Inter', sans-serif; }
  /* Prevent native inputs/selects from forcing their parent wider than the
     viewport (a common cause of horizontal overflow on mobile). */
  input, select, textarea { min-width: 0; max-width: 100%; }
  input[type=number]::-webkit-inner-spin-button { opacity: 0.4; }
  img, svg { max-width: 100%; }

  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 4px; }

  /* Theme transition — applied briefly on toggle */
  .theme-transition,
  .theme-transition * {
    transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease !important;
  }

  /* Animations */
  @keyframes wave {
    0%,100% { transform: scaleX(0.6) translateX(-10px); opacity: 0.4; }
    50%      { transform: scaleX(1) translateX(0);      opacity: 1;   }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes pulse {
    0%,100% { opacity: 1;   }
    50%      { opacity: 0.4; }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
  @keyframes slideInRight {
    from { transform: translateX(100%); }
    to   { transform: translateX(0);    }
  }
  @keyframes slideDown {
    from { opacity: 0; transform: translateY(-8px); }
    to   { opacity: 1; transform: translateY(0);    }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to   { opacity: 1; transform: scale(1);    }
  }
  @keyframes badgePulse {
    0%,100% { transform: scale(1);   }
    50%      { transform: scale(1.2); }
  }

  .eb-card  { animation: fadeUp 0.2s ease forwards; }
  .eb-btn:active { transform: scale(0.97); }

  .eb-shimmer {
    background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%);
    background-size: 400px 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }

  /* Smooth tab content transitions */
  .eb-tab-content { animation: fadeUp 0.18s ease forwards; }

  /* Hide scrollbar (used by the horizontally-scrollable bottom tab bar) */
  .eb-noscroll { scrollbar-width: none; -ms-overflow-style: none; }
  .eb-noscroll::-webkit-scrollbar { display: none; }
`;
document.head.appendChild(style);
