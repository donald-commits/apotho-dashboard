import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test if new fields exist
    const rock = await prisma.rock.findFirst({
      select: {
        id: true,
        title: true,
        status: true,
        targetCompletionDate: true,
        integratorId: true,
      },
    });
    return NextResponse.json({ success: true, rock });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
