import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

const JWT_SECRET =
	process.env.JWT_SECRET || "your-secret-key-change-this-in-production";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD_HASH =
	process.env.ADMIN_PASSWORD_HASH ||
	"$2b$10$lyuDQhYHX2H0oYeKtubx2eLf9K6pD8BGld3i9t5K6eAxGYXde2zoq"; // Default: "weenland2024"

interface User {
	username: string;
	role: string;
}

interface JWTPayload {
	username: string;
	role: string;
	iat?: number;
	exp?: number;
}

export async function verifyPassword(
	password: string,
	hash: string
): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 10);
}

export function generateToken(user: User): string {
	return jwt.sign({ username: user.username, role: user.role }, JWT_SECRET, {
		expiresIn: "24h",
	});
}

export function verifyToken(token: string): JWTPayload | null {
	try {
		return jwt.verify(token, JWT_SECRET) as JWTPayload;
	} catch (error) {
		console.error("Token verification failed:", error);
		return null;
	}
}

export async function authenticateUser(
	username: string,
	password: string
): Promise<User | null> {
	if (username === ADMIN_USERNAME) {
		const isValidPassword = await verifyPassword(password, ADMIN_PASSWORD_HASH);
		if (isValidPassword) {
			return { username: ADMIN_USERNAME, role: "admin" };
		}
	}
	return null;
}

export function getTokenFromRequest(request: NextRequest): string | null {
	const authHeader = request.headers.get("authorization");
	if (authHeader && authHeader.startsWith("Bearer ")) {
		return authHeader.substring(7);
	}

	// Also check cookies
	const tokenCookie = request.cookies.get("auth-token");
	if (tokenCookie) {
		return tokenCookie.value;
	}

	return null;
}

export function verifyAuth(request: NextRequest): JWTPayload | null {
	const token = getTokenFromRequest(request);
	if (!token) {
		return null;
	}

	return verifyToken(token);
}

// Helper to hash password for environment variable
export async function generatePasswordHash(password: string) {
	const hash = await hashPassword(password);
	console.log(`Password hash for "${password}": ${hash}`);
	return hash;
}
