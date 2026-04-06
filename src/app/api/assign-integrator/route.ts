import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// One-time endpoint to assign Donald as integrator on all Q2 2026 rocks
// DELETE THIS FILE after running it once
export async function POST() {
  try {
    // Find Donald's user record
    const donald = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: "donald" } },
          { name: { contains: "Donald" } },
        ],
      },
    });

    if (!donald) {
      return NextResponse.json({ success: false, error: "Donald user not found" }, { status: 404 });
    }

    // Update all Q2 2026 rocks to have Donald as integrator
    const result = await prisma.rock.updateMany({
      where: { quarter: 2, year: 2026 },
      data: { integratorId: donald.id },
    });

    // Also assign on Q1 rocks
    const q1Result = await prisma.rock.updateMany({
      where: { quarter: 1, year: 2026 },
      data: { integratorId: donald.id },
    });

    return NextResponse.json({
      success: true,
      donaldId: donald.id,
      donaldEmail: donald.email,
      q2RocksUpdated: result.count,
      q1RocksUpdated: q1Result.count,
    });
  } catch (error) {
    console.error("Assign integrator error:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
