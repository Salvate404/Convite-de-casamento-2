import { NextResponse } from "next/server";
import { listRsvps } from "@/lib/rsvp-store";

function isAuthorized(request: Request) {
  const password = process.env.ADMIN_PASSWORD || "anneevinicius";
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return token === password;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const rsvps = await listRsvps();
    return NextResponse.json({ rsvps });
  } catch (error) {
    console.error("Admin list error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as confirmações.",
      },
      { status: 500 },
    );
  }
}
