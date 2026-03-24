import { Role } from "../../types/run";
import { ROLES, ROLE_COLORS } from "../../utils/constants";

interface RoleSelectorProps {
  takenRoles: Role[];
  onSelect: (role: Role) => void;
  isLoading: boolean;
}

export default function RoleSelector({
  takenRoles,
  onSelect,
  isLoading,
}: RoleSelectorProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {ROLES.map((role) => {
        const isTaken = takenRoles.includes(role.value as Role);
        return (
          <button
            key={role.value}
            className={`btn ${isTaken ? "" : "btn--primary"}`}
            style={{
              borderColor: ROLE_COLORS[role.value],
              color: isTaken ? "var(--text-muted)" : undefined,
              justifyContent: "flex-start",
            }}
            onClick={() => onSelect(role.value as Role)}
            disabled={isTaken || isLoading}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: ROLE_COLORS[role.value],
                display: "inline-block",
                opacity: isTaken ? 0.4 : 1,
              }}
            />
            {role.label}
            {isTaken && (
              <span style={{ marginLeft: "auto", fontSize: "0.75rem" }}>
                Taken
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
