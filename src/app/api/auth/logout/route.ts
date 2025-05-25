import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
	try {
		// Verify current authentication
		const user = verifyAuth(request);
		if (!user) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		// Create response
		const response = NextResponse.json({
			success: true,
			message: "Logged out successfully",
		});

		// Clear the auth cookie
		response.cookies.set("auth-token", "", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 0, // Expire immediately
		});

		return response;
	} catch (error) {
		console.error("Logout error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
