import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("clinic_session")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Tatawag tayo sa bagong Express Backend mo para i-verify ang token!
    const expressRes = await fetch("http://localhost:5000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!expressRes.ok) {
      return NextResponse.json({ error: "Invalid session in backend" }, { status: 401 });
    }

    const data = await expressRes.json();
    
    // Ipapasa natin ang user data pabalik sa frontend Next.js
    return NextResponse.json({ user: data.user });

  } catch (error: any) {
    console.error("💥 ME ROUTE ERROR:", error.message || error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}