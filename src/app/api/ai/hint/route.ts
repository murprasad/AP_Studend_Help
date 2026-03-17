import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateHint } from "@/lib/ai"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { questionText, options, userAttempt } = await req.json()
  if (!questionText || !options) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  try {
    const hint = await generateHint(questionText, options, userAttempt)
    return NextResponse.json({ hint })
  } catch {
    return NextResponse.json({ error: "Failed to generate hint" }, { status: 500 })
  }
}
