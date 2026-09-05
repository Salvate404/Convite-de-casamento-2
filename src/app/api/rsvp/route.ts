import { NextResponse } from "next/server";
import { findRsvpByGuestId, upsertRsvp } from "@/lib/rsvp-store";
import { findAdultGuest, findChildGuest, GROUP_LABELS, type GuestGroup } from "@/lib/guests";
import type { RsvpChild, RsvpPayload } from "@/lib/rsvp-types";

function cleanName(value: unknown) {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function isGuestGroup(value: unknown): value is GuestGroup {
  return typeof value === "string" && value in GROUP_LABELS;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<RsvpPayload>;
    const phone = cleanName(body.phone);
    const message = cleanName(body.message);
    const attending = body.attending === "no" ? "no" : body.attending === "yes" ? "yes" : null;
    const guestId = cleanName(body.guestId);
    const adult = findAdultGuest(guestId);

    if (!adult) {
      return NextResponse.json(
        { error: "Clique no seu nome na lista para confirmar." },
        { status: 400 },
      );
    }

    const group = isGuestGroup(body.group) ? body.group : adult.group;
    const contactName = adult.name;

    if (!attending) {
      return NextResponse.json(
        { error: "Selecione se poderá comparecer." },
        { status: 400 },
      );
    }

    const children: RsvpChild[] = [];
    if (Array.isArray(body.children)) {
      for (const child of body.children) {
        const custom = Boolean(child?.custom);
        const childId = cleanName(child?.guestId);
        const listed = childId ? findChildGuest(childId) : undefined;
        const name = listed?.name || cleanName(child?.name);
        if (!name) continue;
        if (!custom && !listed) continue;
        children.push({
          name,
          guestId: listed?.id,
          custom: custom && !listed,
        });
      }
    }

    if (
      Array.isArray(body.children) &&
      body.children.some((child) => {
        const name = cleanName(child?.name);
        return name && !child?.custom && !findChildGuest(cleanName(child?.guestId));
      })
    ) {
      return NextResponse.json(
        { error: "Clique no nome da criança na lista, ou em + adicionar criança." },
        { status: 400 },
      );
    }

    const guests =
      attending === "yes"
        ? [
            `${contactName} · ${GROUP_LABELS[group]}`,
            ...children.map((child) => `${child.name} · Criança`),
          ]
        : [];

    const { record, updated } = await upsertRsvp({
      contactName,
      guestId: adult.id,
      group,
      phone: phone || undefined,
      attending,
      guests,
      children: attending === "yes" ? children : [],
      message: message || undefined,
    });

    return NextResponse.json({ ok: true, id: record.id, updated });
  } catch (error) {
    console.error("RSVP error:", error);
    return NextResponse.json(
      { error: "Não foi possível salvar a confirmação. Tente novamente." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  const guestId = new URL(request.url).searchParams.get("guestId")?.trim() || "";
  if (!guestId || !findAdultGuest(guestId)) {
    return NextResponse.json({ rsvp: null });
  }

  try {
    const rsvp = await findRsvpByGuestId(guestId);
    return NextResponse.json({ rsvp });
  } catch (error) {
    console.error("RSVP lookup error:", error);
    return NextResponse.json({ rsvp: null });
  }
}
