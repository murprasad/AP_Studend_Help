import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateHint } from "@/lib/ai"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { questionText, options, userAttempt, hintLevel } = await req.json()
  if (!questionText || !options) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const level = Math.min(3, Math.max(1, parseInt(hintLevel ?? "1"))) as 1 | 2 | 3

  try {
    const hint = await generateHint(questionText, options, userAttempt, level)
    return NextResponse.json({ hint, hintLevel: level })
  } catch {
    return NextResponse.json({ error: "Failed to generate hint" }, { status: 500 })
  }
}
