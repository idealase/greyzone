import { NavLink } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";

export default function Header() {
  const user = useAuthStore((s) => s.user);

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
      </nav>
      <div className="app-header__user">
        {user ? (
          <span>{user.display_name || user.username}</span>
        ) : (
          <span>Not logged in</span>
        )}
      </div>
    </header>
  );
}
