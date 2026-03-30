import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listRuns } from "../../api/runs";

export default function Sidebar() {
  const { data: runs } = useQuery({
    queryKey: ["runs"],
    queryFn: listRuns,
    refetchInterval: 15_000,
  });

  const activeRuns = runs?.filter(
    (r) => r.status === "lobby" || r.status === "in_progress"
  );

  return (
    <aside className="app-sidebar">
      <div className="sidebar-section-title">Navigation</div>
      <ul className="sidebar-nav">
        <li className="sidebar-nav__item">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `sidebar-nav__link${isActive ? " active" : ""}`
            }
            end
          >
            Home
          </NavLink>
        </li>
        <li className="sidebar-nav__item">
          <NavLink
            to="/scenarios"
            className={({ isActive }) =>
              `sidebar-nav__link${isActive ? " active" : ""}`
            }
          >
            Scenarios
          </NavLink>
        </li>
        <li className="sidebar-nav__item">
          <NavLink
            to="/runs/new"
            className={({ isActive }) =>
              `sidebar-nav__link${isActive ? " active" : ""}`
            }
          >
            New Run
          </NavLink>
        </li>
        <li className="sidebar-nav__item">
          <NavLink
            to="/tutorial"
            className={({ isActive }) =>
              `sidebar-nav__link${isActive ? " active" : ""}`
            }
          >
            Tutorial
          </NavLink>
        </li>
      </ul>

      <div className="sidebar-section-title">Docs & Help</div>
      <ul className="sidebar-nav">
        <li className="sidebar-nav__item">
          <NavLink
            to="/help"
            className={({ isActive }) =>
              `sidebar-nav__link${isActive ? " active" : ""}`
            }
          >
            Help & FAQ
          </NavLink>
        </li>
        <li className="sidebar-nav__item">
          <a
            href="https://github.com/idealase/greyzone/blob/main/docs/simulation-spec.md"
            className="sidebar-nav__link"
            target="_blank"
            rel="noreferrer"
          >
            Simulation Spec ↗
          </a>
        </li>
        <li className="sidebar-nav__item">
          <a
            href="https://github.com/idealase/greyzone/blob/main/docs/product-spec.md"
            className="sidebar-nav__link"
            target="_blank"
            rel="noreferrer"
          >
            Product Spec ↗
          </a>
        </li>
      </ul>

      {activeRuns && activeRuns.length > 0 && (
        <>
          <div className="sidebar-section-title">Active Runs</div>
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
                >
                  <span>{run.name}</span>
                  <span
                    className={`badge badge--${
                      run.status === "lobby" ? "yellow" : "green"
                    }`}
                  >
                    {run.status === "lobby" ? "Lobby" : `T${run.current_turn}`}
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
