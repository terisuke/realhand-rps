import { z } from "zod";

export const MoveSchema = z.enum(["rock", "paper", "scissors"]);

export const PersonalitySchema = z.enum(["provocative", "analytical", "uncanny"]);

export const PredictorInputSchema = z.object({
  playerMove: MoveSchema,
  aiMove: MoveSchema,
  result: z.enum(["win", "lose", "draw"]),
});

export const StartRoundSchema = z.object({
  session_id: z.string().min(1),
  rounds: z.array(PredictorInputSchema).default([]),
  personality: PersonalitySchema.default("analytical"),
  current_round: z.number().int().min(1).max(30).default(1),
});

export const SubmitMoveSchema = z.object({
  session_id: z.string().min(1),
  round_number: z.number().int().min(1).max(30),
  player_move: MoveSchema,
});

export type StartRoundInput = z.infer<typeof StartRoundSchema>;
export type SubmitMoveInput = z.infer<typeof SubmitMoveSchema>;
