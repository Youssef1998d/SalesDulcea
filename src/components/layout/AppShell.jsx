import { useTheme } from "../../core/theme";
import { useIsMobile } from "../../hooks/useIsMobile";
import { OrgHeader } from "./OrgHeader";
import { BottomBar } from "./BottomBar";
import { Sidebar }   from "./Sidebar";
import { Btn } from "../ui";

/**
 * AppShell — responsive layout container.
 * Mobile: OrgHeader (top) + scrollable content + BottomBar (fixed bottom)
 * Desktop: Sidebar (left, fixed) + OrgHeader (top of right panel) + scrollable content
 */
export function AppShell({
  tabs,
  active,
  onChange,
  agent,
  onSignOut,
  onThemeToggle,
  themeMode,
  children,
}) {
  const T      = useTheme();
  const mobile = useIsMobile();

  // Update body background to match theme
  document.body.style.background = T.bg;

  if (mobile) {
    return (
      <div style={{
        background: T.bg, minHeight: "100vh",
        maxWidth: 480, margin: "0 auto",
        fontFamily: "'Inter', sans-serif",
        color: T.text,
        paddingBottom: 80,
        display: "flex", flexDirection: "column",
      }}>
        <OrgHeader
          onThemeToggle={onThemeToggle}
          themeMode={themeMode}
          rightSlot={
            <Btn size="sm" variant="ghost" onClick={onSignOut}>Déco</Btn>
          }
        />
        <div style={{ flex: 1, padding: "16px 16px 0" }} className="eb-tab-content">
          {children}
        </div>
        <BottomBar tabs={tabs} active={active} onChange={onChange} />
      </div>
    );
  }

  // Desktop layout
  return (
    <div style={{
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      background: T.bg,
      fontFamily: "'Inter', sans-serif",
      color: T.text,
    }}>
      <Sidebar
        tabs={tabs}
        active={active}
        onChange={onChange}
        agent={agent}
        onSignOut={onSignOut}
        onThemeToggle={onThemeToggle}
        themeMode={themeMode}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <OrgHeader compact />
        <div style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 32px" }} className="eb-tab-content">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
