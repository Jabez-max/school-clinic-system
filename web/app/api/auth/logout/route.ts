import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    // Tinatawag nito ang backend API mo sa Render para i-save sa database ang logout log
    if (token) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout-log`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      }).catch(err => console.error("Failed to log logout to backend:", err));
    }

    // Delete the cookie para ma-log out ang user sa frontend
    const response = NextResponse.json({ message: "Logged out successfully" });
    response.cookies.delete("auth_token");
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}