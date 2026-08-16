import { NextResponse } from "next/server";
import { createRsvp } from "@/lib/rsvp-store";
import { GROUP_LABELS, type GuestGroup } from "@/lib/guests";
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
    const contactName = cleanName(body.contactName);
    const phone = cleanName(body.phone);
    const message = cleanName(body.message);
    const attending = body.attending === "no" ? "no" : body.attending === "yes" ? "yes" : null;
    const group = isGuestGroup(body.group) ? body.group : undefined;
    const guestId = cleanName(body.guestId) || undefined;
    const children: RsvpChild[] = Array.isArray(body.children)
      ? body.children
          .map((child) => ({
            name: cleanName(child?.name),
            guestId: cleanName(child?.guestId) || undefined,
            custom: Boolean(child?.custom),
          }))
          .filter((child) => child.name)
      : [];

    if (!contactName || contactName.length < 2) {
      return NextResponse.json(
        { error: "Informe o nome de quem está confirmando." },
        { status: 400 },
      );
    }

    if (!attending) {
      return NextResponse.json(
        { error: "Selecione se poderá comparecer." },
        { status: 400 },
      );
    }

    const guests =
      attending === "yes"
        ? [
            group ? `${contactName} · ${GROUP_LABELS[group]}` : contactName,
            ...children.map((child) => `${child.name} · Criança`),
          ]
        : [];

    const record = await createRsvp({
      contactName,
      guestId,
      group,
      phone: phone || undefined,
      attending,
      guests,
      children: attending === "yes" ? children : [],
      message: message || undefined,
    });

    return NextResponse.json({ ok: true, id: record.id });
  } catch (error) {
    console.error("RSVP error:", error);
    return NextResponse.json(
      { error: "Não foi possível salvar a confirmação. Tente novamente." },
      { status: 500 },
    );
  }
}
