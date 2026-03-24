export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
}

export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object";
  description: string;
  required: boolean;
}

export const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: "getTurnBrief",
    description:
      "Get a compiled briefing of the current turn state, including salient changes, objectives, and strategic tradeoffs.",
    parameters: [
      {
        name: "runId",
        type: "string",
        description: "The simulation run ID",
        required: true,
      },
      {
        name: "roleId",
        type: "string",
        description: "The role ID for scoped visibility",
        required: true,
      },
    ],
  },
  {
    name: "getRoleVisibleState",
    description:
      "Get the full role-scoped world state including all domain values.",
    parameters: [
      {
        name: "runId",
        type: "string",
        description: "The simulation run ID",
        required: true,
      },
      {
        name: "roleId",
        type: "string",
        description: "The role ID for scoped visibility",
        required: true,
      },
    ],
  },
  {
    name: "listLegalActions",
    description:
      "List all legal actions available to the role this turn, with descriptions and intensity ranges.",
    parameters: [
      {
        name: "runId",
        type: "string",
        description: "The simulation run ID",
        required: true,
      },
      {
        name: "roleId",
        type: "string",
        description: "The role ID",
        required: true,
      },
    ],
  },
  {
    name: "inspectAction",
    description:
      "Get detailed description and expected effects of a specific action type in a target domain.",
    parameters: [
      {
        name: "runId",
        type: "string",
        description: "The simulation run ID",
        required: true,
      },
      {
        name: "actionType",
        type: "string",
        description: "The action type to inspect",
        required: true,
      },
      {
        name: "targetDomain",
        type: "string",
        description: "The target domain",
        required: true,
      },
    ],
  },
  {
    name: "estimateLocalEffects",
    description:
      "Estimate the immediate local effects of an action given current state.",
    parameters: [
      {
        name: "actionType",
        type: "string",
        description: "The action type",
        required: true,
      },
      {
        name: "targetDomain",
        type: "string",
        description: "The target domain",
        required: true,
      },
      {
        name: "intensity",
        type: "number",
        description: "The action intensity (0-1)",
        required: true,
      },
      {
        name: "currentStress",
        type: "number",
        description: "Current stress in the target domain",
        required: true,
      },
      {
        name: "currentResilience",
        type: "number",
        description: "Current resilience in the target domain",
        required: true,
      },
    ],
  },
  {
    name: "submitAction",
    description: "Submit a selected action for execution in the simulation.",
    parameters: [
      {
        name: "runId",
        type: "string",
        description: "The simulation run ID",
        required: true,
      },
      {
        name: "roleId",
        type: "string",
        description: "The role ID",
        required: true,
      },
      {
        name: "actionType",
        type: "string",
        description: "The action type to execute",
        required: true,
      },
      {
        name: "targetDomain",
        type: "string",
        description: "The target domain",
        required: true,
      },
      {
        name: "intensity",
        type: "number",
        description: "The action intensity (0-1)",
        required: true,
      },
      {
        name: "rationale",
        type: "string",
        description: "Rationale for the action",
        required: true,
      },
    ],
  },
  {
    name: "endTurn",
    description: "Signal that this role has finished its turn.",
    parameters: [
      {
        name: "runId",
        type: "string",
        description: "The simulation run ID",
        required: true,
      },
      {
        name: "roleId",
        type: "string",
        description: "The role ID",
        required: true,
      },
    ],
  },
];

export function getToolDefinitions(): ToolDefinition[] {
  return TOOL_DEFINITIONS;
}
