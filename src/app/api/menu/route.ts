import { NextRequest, NextResponse } from "next/server";
import { HALLS } from "@/constants/halls";
import { fetchTodayMenu } from "@/lib/nutrislice";

export async function GET(request: NextRequest) {
  const hall = request.nextUrl.searchParams.get("hall");
  const date = request.nextUrl.searchParams.get("date");

  if (!hall || !HALLS.some((h) => h.slug === hall)) {
    return NextResponse.json(
      { error: "Invalid or missing hall" },
      { status: 400 },
    );
  }

  try {
    const data = await fetchTodayMenu(hall, date);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "s-maxage=600, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load menu";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
