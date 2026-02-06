import { NextResponse } from "next/server";

const instructions =
  "This endpoint was removed in favor of the Rust backend. Call the Axum API exposed via NEXT_PUBLIC_API_BASE (defaults to http://localhost:3001).";

const removed = () =>
  NextResponse.json(
    {
      error: "/api/agent has moved",
      detail: instructions,
    },
    { status: 410, headers: { "Cache-Control": "no-store" } },
  );

export const runtime = "nodejs";

export async function GET() {
  return removed();
}

export async function POST() {
  return removed();
}

export async function PUT() {
  return removed();
}

export async function DELETE() {
  return removed();
}
