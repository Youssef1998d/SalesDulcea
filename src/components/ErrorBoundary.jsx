import { Component } from "react";

// App-wide safety net: a render error shows a recoverable message instead of a
// blank white screen (and surfaces the error text for debugging).
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error("App error:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: "100vh", background: "#0a1628", color: "#e8f4ff",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: 32, textAlign: "center", fontFamily: "'Inter', sans-serif",
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Une erreur est survenue</div>
          <div style={{ fontSize: 13, color: "#7eb8f7", maxWidth: 360, marginBottom: 20, wordBreak: "break-word" }}>
            {String(this.state.error?.message || this.state.error)}
          </div>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            style={{
              background: "#2e7dd4", color: "#fff", border: "none", borderRadius: 10,
              padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer",
            }}
          >
            Recharger l'application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
