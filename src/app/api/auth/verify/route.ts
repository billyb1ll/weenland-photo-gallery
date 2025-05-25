import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";

export async function GET(request: NextRequest) {
	try {
		const user = verifyAuth(request);

		if (!user) {
			return NextResponse.json({ authenticated: false }, { status: 200 });
		}

		return NextResponse.json({
			authenticated: true,
			user: { username: user.username, role: user.role },
		});
	} catch (error) {
		console.error("Verify auth error:", error);
		return NextResponse.json({ authenticated: false }, { status: 200 });
	}
}
