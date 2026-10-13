import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { SessionPayload } from "@/lib/auth";

export async function requireAuth(
  request: NextRequest
): Promise<{ session: SessionPayload; error?: undefined } | { error: NextResponse; session?: undefined }> {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return {
      error: NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      ),
    };
  }
  return { session };
}

export function createApiError(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function createApiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status });
}
