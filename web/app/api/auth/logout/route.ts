import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST() {
  try {
    // FIX: Nilagyan din natin ng 'await' ang cookies()
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (token) {
      const payload = await verifyToken(token);
      if (payload && payload.id) {
        // Log the logout action securely
        await prisma.auditLog.create({
          data: {
            action: "USER_LOGOUT",
            entityType: "USER",
            entityId: payload.id as string,
            performedBy: payload.id as string,
            details: "User logged out securely.",
          }
        });
      }
    }

    // Delete the cookie
    const response = NextResponse.json({ message: "Logged out successfully" });
    response.cookies.delete("auth_token");
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}