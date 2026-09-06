import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Ipapasa natin ang credentials sa iyong Express Backend
    const backendRes = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();

    // 2. Kung nag-error sa backend (mali ang password, o walang account)
    if (!backendRes.ok) {
      return NextResponse.json(
        { error: data.error || "Login failed" }, 
        { status: backendRes.status }
      );
    }

    // 3. Kung success, i-save ang token sa cookies ng browser
    const cookieStore = await cookies();
    cookieStore.set("clinic_session", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 hours
      path: "/",
    });

    // Ibalik ang success response sa frontend
    return NextResponse.json({ success: true, role: data.role });
    
  } catch (error) {
    console.error("Frontend Proxy Error:", error);
    return NextResponse.json({ error: "Failed to connect to backend server" }, { status: 500 });
  }
}