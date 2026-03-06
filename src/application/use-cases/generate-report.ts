import { buildSessionReport, type SessionReport } from "@/domain/game/session-report";
import type { RoundData } from "@/domain/game/round";

export interface GenerateReportInput {
  rounds: RoundData[];
}

export function generateReport(input: GenerateReportInput): SessionReport {
  return buildSessionReport(input.rounds);
}
