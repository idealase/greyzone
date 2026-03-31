import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();
  const [helpOpen, setHelpOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  function handleLogout() {
    clear();
    navigate("/login");
  }

  useEffect(() => {
    if (!helpOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setHelpOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setHelpOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [helpOpen]);

  return (
    <header className="app-header">
      <span className="app-header__title">GREYZONE</span>
      <nav className="app-header__nav">
        <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""} end>
          Home
        </NavLink>
        <NavLink to="/scenarios" className={({ isActive }) => isActive ? "active" : ""}>
          Scenarios
        </NavLink>
        <NavLink to="/runs/new" className={({ isActive }) => isActive ? "active" : ""}>
          New Run
        </NavLink>
        <NavLink to="/tutorial" className={({ isActive }) => isActive ? "active" : ""}>
          Tutorial
        </NavLink>
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div className="help-menu" ref={menuRef}>
          <button
            className="help-menu__button"
            aria-label="Help and documentation"
            aria-expanded={helpOpen}
            onClick={() => setHelpOpen((v) => !v)}
          >
            ?
          </button>
          {helpOpen && (
            <div className="help-menu__dropdown">
              <NavLink
                to="/tutorial"
                className="help-menu__item"
                onClick={() => setHelpOpen(false)}
              >
                Tutorial
                <span>8-step guided intro</span>
              </NavLink>
              <NavLink
                to="/help"
                className="help-menu__item"
                onClick={() => setHelpOpen(false)}
              >
                Help & Docs
                <span>FAQs and links</span>
              </NavLink>
              <div className="help-menu__separator" />
              <a
                className="help-menu__item"
                href="https://github.com/idealase/greyzone/blob/main/docs/simulation-spec.md"
                target="_blank"
                rel="noreferrer"
              >
                Simulation Guide
                <span>docs/simulation-spec</span>
              </a>
              <a
                className="help-menu__item"
                href="https://github.com/idealase/greyzone/blob/main/docs/api-spec.md"
                target="_blank"
                rel="noreferrer"
              >
                API Docs
                <span>docs/api-spec</span>
              </a>
              <div className="help-menu__separator" />
              <a
                className="help-menu__item"
                href="https://github.com/idealase/greyzone/issues/new/choose"
                target="_blank"
                rel="noreferrer"
              >
                Report an Issue
                <span>opens GitHub</span>
              </a>
            </div>
          )}
        </div>
        <div className="app-header__user">
          {user ? (
            <>
              <span>{user.display_name || user.username}</span>
              <button
                onClick={handleLogout}
                style={{
                  marginLeft: "0.75rem",
                  padding: "0.25rem 0.6rem",
                  backgroundColor: "transparent",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  color: "var(--text-secondary)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <span>Not logged in</span>
          )}
        </div>
      </div>
    </header>
  );
}
