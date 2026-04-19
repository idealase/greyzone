import axios from "axios";
import { config } from "../config.js";
import type { LegalAction } from "../types/index.js";
import { mapLegalActionsResponse } from "../mappers/apiResponse.js";

export async function listLegalActions(
  runId: string,
  roleId: string
): Promise<LegalAction[]> {
  const response = await axios.get(
    `${config.apiBaseUrl}/runs/${runId}/legal-actions`,
    {
      params: { role_id: roleId },
      timeout: 10000,
      headers: { "X-Service-Key": config.internalServiceKey, "X-User-Id": config.aiUserId },
    }
  );

  return mapLegalActionsResponse(response.data);
}
