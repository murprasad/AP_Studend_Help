/**
 * POST /api/validate-question — admin-only question validation endpoint.
 * Runs every implemented gate (deterministic + CAS + LLM second-pass) and
 * returns ValidationResult.
 *
 * See src/lib/validate-question.ts for layer details + cost.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateQuestion, type ValidationOptions, type ValidateQuestionInput } from "@/lib/validate-question";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized — admin only" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const required = ["questionText", "options", "correctAnswer", "course", "unit"];
  const missing = required.filter((k) => body[k] === undefined || body[k] === null);
  if (missing.length > 0) {
    return NextResponse.json({ error: `Missing required field(s): ${missing.join(", ")}` }, { status: 400 });
  }
  if (!Array.isArray(body.options)) {
    return NextResponse.json({ error: "options must be an array" }, { status: 400 });
  }

  const q: ValidateQuestionInput = {
    questionText: String(body.questionText),
    options: body.options.map(String),
    correctAnswer: String(body.correctAnswer),
    explanation: body.explanation ? String(body.explanation) : undefined,
    stimulus: body.stimulus ? String(body.stimulus) : undefined,
    course: String(body.course),
    unit: String(body.unit),
  };

  const opts: ValidationOptions = {
    llmVerify: body.llmVerify !== false,
    casRecompute: ["auto", "force", "skip"].includes(body.casRecompute) ? body.casRecompute : "auto",
  };

  try {
    const result = await validateQuestion(q, opts);
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: "Validation error", detail: (e?.message || String(e)).slice(0, 300) },
      { status: 500 },
    );
  }
}
