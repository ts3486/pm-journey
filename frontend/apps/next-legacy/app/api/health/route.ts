import { NextResponse } from "next/server";

export const runtime = "nodejs";

type HealthResponse = {
  status: "ok";
  service: "pm-journey-frontend";
  timestamp: string;
};

export async function GET() {
  const body: HealthResponse = {
    status: "ok",
    service: "pm-journey-frontend",
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
