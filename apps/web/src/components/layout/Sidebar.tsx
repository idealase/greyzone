import { NavLink } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listRuns, deleteRun } from "../../api/runs";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const queryClient = useQueryClient();
  const { data: runs } = useQuery({
    queryKey: ["runs"],
    queryFn: listRuns,
    refetchInterval: 15_000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRun,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["runs"] }),
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
          <SidebarLink to="/sim-spec" label="Sim Spec" icon="📐" collapsed={collapsed} />
        </ul>

        {activeRuns && activeRuns.length > 0 && (
          <>
            <div className="sidebar-section-title">{collapsed ? "" : "Active Runs"}</div>
            <ul className="sidebar-nav">
              {activeRuns.map((run) => (
                <li key={run.id} className="sidebar-nav__item" style={{ display: "flex", alignItems: "center" }}>
                  <NavLink
                    to={
                      run.status === "lobby"
                        ? `/runs/${run.id}/lobby`
                        : `/runs/${run.id}`
                    }
                    className={({ isActive }) =>
                      `sidebar-nav__link${isActive ? " active" : ""}`
                    }
                    style={{ flex: 1 }}
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
                  {!collapsed && (
                    <button
                      className="sidebar-delete-btn"
                      title="Remove run"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(run.id);
                      }}
                    >
                      ×
                    </button>
                  )}
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
