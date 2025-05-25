import { NextRequest, NextResponse } from "next/server";
import { authenticateUser, generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
	try {
		const { username, password } = await request.json();

		if (!username || !password) {
			return NextResponse.json(
				{ error: "Username and password are required" },
				{ status: 400 }
			);
		}

		const user = await authenticateUser(username, password);
		if (!user) {
			return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
		}

		const token = generateToken(user);

		// Create response with token
		const response = NextResponse.json({
			success: true,
			user: { username: user.username, role: user.role },
			token,
		});

		// Set secure HTTP-only cookie
		response.cookies.set("auth-token", token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "strict",
			maxAge: 24 * 60 * 60, // 24 hours
		});

		return response;
	} catch (error) {
		console.error("Login error:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
