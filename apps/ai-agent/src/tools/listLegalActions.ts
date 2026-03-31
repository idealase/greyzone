import axios from "axios";
import { config } from "../config.js";
import type { LegalAction } from "../types/index.js";

export async function listLegalActions(
  runId: string,
  roleId: string
): Promise<LegalAction[]> {
  const response = await axios.get<LegalAction[]>(
    `${config.apiBaseUrl}/runs/${runId}/legal-actions`,
    {
      params: { role_id: roleId },
      timeout: 10000,
      headers: { "X-User-Id": config.aiUserId },
    }
  );

  return response.data;
}
