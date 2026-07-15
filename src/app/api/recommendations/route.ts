import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getClaudeClient, CLAUDE_MODEL } from "@/lib/claude/client";
import { SYSTEM_PROMPT } from "@/lib/claude/systemPrompt";
import { buildCarContext } from "@/lib/claude/buildCarContext";
import { RecommendationSchema } from "@/lib/claude/recommendationSchema";
import { getCarData, listCarIds } from "@/lib/setup/carData";
import type { DisplaySetup } from "@/lib/setup/types";

interface RequestBody {
  carId: string;
  symptom: string;
  cornerPhase?: "entry" | "mid" | "exit" | "braking" | "general";
  speedRegime?: "low" | "high" | "general";
  conditions?: { trackTempC?: number; ambientTempC?: number; wet?: boolean };
  currentSetup?: DisplaySetup;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (!body.carId || typeof body.carId !== "string") {
    return NextResponse.json({ error: "carId is required." }, { status: 400 });
  }
  if (!body.symptom || typeof body.symptom !== "string" || body.symptom.trim().length === 0) {
    return NextResponse.json({ error: "symptom is required." }, { status: 400 });
  }

  let car;
  try {
    car = getCarData(body.carId);
  } catch {
    return NextResponse.json(
      { error: `Unknown carId "${body.carId}". Available: ${listCarIds().join(", ")}` },
      { status: 400 }
    );
  }

  const contextLines = [buildCarContext(car, body.currentSetup)];
  if (body.cornerPhase) contextLines.push(`Corner phase: ${body.cornerPhase}`);
  if (body.speedRegime) contextLines.push(`Speed regime: ${body.speedRegime}`);
  if (body.conditions) {
    const c = body.conditions;
    contextLines.push(
      `Conditions: ${c.wet ? "wet" : "dry"}${c.trackTempC !== undefined ? `, track ${c.trackTempC}°C` : ""}${
        c.ambientTempC !== undefined ? `, ambient ${c.ambientTempC}°C` : ""
      }`
    );
  }

  const userMessage = `Symptom: ${body.symptom.trim()}\n\n${contextLines.join("\n")}`;

  const client = getClaudeClient();

  try {
    const message = await client.messages.parse({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      output_config: { format: zodOutputFormat(RecommendationSchema) },
      messages: [{ role: "user", content: userMessage }],
    });

    if (message.stop_reason === "refusal") {
      return NextResponse.json({ error: "The model declined to answer this request." }, { status: 422 });
    }

    if (!message.parsed_output) {
      return NextResponse.json({ error: "Model response could not be parsed." }, { status: 502 });
    }

    return NextResponse.json(message.parsed_output);
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      return NextResponse.json({ error: error.message }, { status: error.status ?? 502 });
    }
    throw error;
  }
}
