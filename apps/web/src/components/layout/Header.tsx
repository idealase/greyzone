import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

export default function Header() {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const navigate = useNavigate();

  function handleLogout() {
    clear();
    navigate("/login");
  }

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
    </header>
  );
}
