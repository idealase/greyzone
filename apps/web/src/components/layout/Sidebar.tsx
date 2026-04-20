import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listRuns } from "../../api/runs";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { data: runs } = useQuery({
    queryKey: ["runs"],
    queryFn: listRuns,
    refetchInterval: 15_000,
  });

  const activeRuns = runs?.filter(
    (r) => r.status === "lobby" || r.status === "in_progress"
  );

  return (
    <aside className={`app-sidebar${collapsed ? " app-sidebar--collapsed" : ""}`}>
      <button
        className="sidebar-toggle"
        onClick={onToggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          {collapsed ? (
            <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </svg>
      </button>

      <div className="sidebar-scroll">
        <div className="sidebar-section-title">{collapsed ? "" : "Navigation"}</div>
        <ul className="sidebar-nav">
          <SidebarLink to="/" label="Home" icon="⌂" collapsed={collapsed} end />
          <SidebarLink to="/scenarios" label="Scenarios" icon="◈" collapsed={collapsed} />
          <SidebarLink to="/runs/new" label="New Run" icon="+" collapsed={collapsed} />
          <SidebarLink to="/tutorial" label="Tutorial" icon="?" collapsed={collapsed} />
        </ul>

        <div className="sidebar-section-title">{collapsed ? "" : "Docs & Help"}</div>
        <ul className="sidebar-nav">
          <SidebarLink to="/help" label="Help & FAQ" icon="📖" collapsed={collapsed} />
          <li className="sidebar-nav__item">
            <a
              href="https://github.com/idealase/greyzone/blob/main/docs/simulation-spec.md"
              className="sidebar-nav__link"
              target="_blank"
              rel="noreferrer"
              title={collapsed ? "Simulation Spec" : undefined}
            >
              <span className="sidebar-icon">📄</span>
              {!collapsed && <span>Simulation Spec ↗</span>}
            </a>
          </li>
          <li className="sidebar-nav__item">
            <a
              href="https://github.com/idealase/greyzone/blob/main/docs/product-spec.md"
              className="sidebar-nav__link"
              target="_blank"
              rel="noreferrer"
              title={collapsed ? "Product Spec" : undefined}
            >
              <span className="sidebar-icon">📋</span>
              {!collapsed && <span>Product Spec ↗</span>}
            </a>
          </li>
        </ul>

        {activeRuns && activeRuns.length > 0 && (
          <>
            <div className="sidebar-section-title">{collapsed ? "" : "Active Runs"}</div>
            <ul className="sidebar-nav">
              {activeRuns.map((run) => (
                <li key={run.id} className="sidebar-nav__item">
                  <NavLink
                    to={
                      run.status === "lobby"
                        ? `/runs/${run.id}/lobby`
                        : `/runs/${run.id}`
                    }
                    className={({ isActive }) =>
                      `sidebar-nav__link${isActive ? " active" : ""}`
                    }
                    title={collapsed ? run.name : undefined}
                  >
                    <span className="sidebar-icon">▶</span>
                    {!collapsed && (
                      <>
                        <span>{run.name}</span>
                        <span
                          className={`badge badge--${
                            run.status === "lobby" ? "yellow" : "green"
                          }`}
                        >
                          {run.status === "lobby" ? "Lobby" : `T${run.current_turn}`}
                        </span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </aside>
  );
}

function SidebarLink({
  to,
  label,
  icon,
  collapsed,
  end,
}: {
  to: string;
  label: string;
  icon: string;
  collapsed: boolean;
  end?: boolean;
}) {
  return (
    <li className="sidebar-nav__item">
      <NavLink
        to={to}
        className={({ isActive }) =>
          `sidebar-nav__link${isActive ? " active" : ""}`
        }
        end={end}
        title={collapsed ? label : undefined}
      >
        <span className="sidebar-icon">{icon}</span>
        {!collapsed && <span>{label}</span>}
      </NavLink>
    </li>
  );
}
