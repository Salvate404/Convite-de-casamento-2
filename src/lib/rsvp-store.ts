import { neon } from "@neondatabase/serverless";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { RsvpChild, RsvpPayload, RsvpRecord } from "./rsvp-types";

const localPath = path.join(process.cwd(), "data", "rsvps.json");

function getDatabaseUrl() {
  const candidates = [
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.NEON_DATABASE_URL,
  ];

  return (
    candidates.find(
      (value) =>
        typeof value === "string" &&
        /^(postgres(ql)?:\/\/|https:\/\/)/i.test(value.trim()),
    )?.trim() || ""
  );
}

function hasDatabase() {
  return Boolean(getDatabaseUrl());
}

function sqlClient() {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error(
      "Banco Neon não configurado. Cole a URL postgres do Neon em DATABASE_URL no .env.local.",
    );
  }
  return neon(url);
}

function parseGuests(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function parseChildren(value: unknown): RsvpChild[] {
  if (Array.isArray(value)) return value as RsvpChild[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? (parsed as RsvpChild[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function toRecord(row: Record<string, unknown>): RsvpRecord {
  return {
    id: String(row.id),
    contactName: String(row.contact_name),
    guestId: row.guest_id ? String(row.guest_id) : undefined,
    group: row.guest_group ? String(row.guest_group) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
    attending: row.attending as "yes" | "no",
    guests: parseGuests(row.guests),
    children: parseChildren(row.children),
    message: row.message ? String(row.message) : undefined,
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

async function ensureLocalFile() {
  await fs.mkdir(path.dirname(localPath), { recursive: true });
  try {
    await fs.access(localPath);
  } catch {
    await fs.writeFile(localPath, "[]", "utf8");
  }
}

async function ensureNeonTable() {
  const sql = sqlClient();
  await sql`
    CREATE TABLE IF NOT EXISTS rsvps (
      id TEXT PRIMARY KEY,
      contact_name TEXT NOT NULL,
      phone TEXT,
      attending TEXT NOT NULL,
      guests JSONB NOT NULL,
      message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_id TEXT`;
  await sql`ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS guest_group TEXT`;
  await sql`ALTER TABLE rsvps ADD COLUMN IF NOT EXISTS children JSONB NOT NULL DEFAULT '[]'::jsonb`;
  try {
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS rsvps_guest_id_key
      ON rsvps (guest_id)
      WHERE guest_id IS NOT NULL AND guest_id <> ''
    `;
  } catch (error) {
    console.warn("Não foi possível criar índice único de guest_id:", error);
  }
}

export async function findRsvpByGuestId(guestId: string): Promise<RsvpRecord | null> {
  if (!guestId) return null;

  if (hasDatabase()) {
    await ensureNeonTable();
    const sql = sqlClient();
    const rows = await sql`
      SELECT id, contact_name, guest_id, guest_group, phone, attending, guests, children, message, created_at
      FROM rsvps
      WHERE guest_id = ${guestId}
      ORDER BY created_at DESC
      LIMIT 1
    `;
    const row = rows[0];
    return row ? toRecord(row as Record<string, unknown>) : null;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Banco Neon não configurado na Vercel. Ligue o Storage (Neon) e faça um redeploy.",
    );
  }

  await ensureLocalFile();
  const raw = await fs.readFile(localPath, "utf8");
  const list = JSON.parse(raw) as RsvpRecord[];
  return list.find((item) => item.guestId === guestId) ?? null;
}

export async function upsertRsvp(
  payload: RsvpPayload,
): Promise<{ record: RsvpRecord; updated: boolean }> {
  const existing = payload.guestId ? await findRsvpByGuestId(payload.guestId) : null;
  const record: RsvpRecord = {
    id: existing?.id ?? randomUUID(),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    ...payload,
  };

  if (hasDatabase()) {
    await ensureNeonTable();
    const sql = sqlClient();

    if (existing) {
      await sql`
        UPDATE rsvps
        SET
          contact_name = ${record.contactName},
          guest_id = ${record.guestId ?? null},
          guest_group = ${record.group ?? null},
          phone = ${record.phone ?? null},
          attending = ${record.attending},
          guests = ${JSON.stringify(record.guests)},
          children = ${JSON.stringify(record.children ?? [])},
          message = ${record.message ?? null}
        WHERE id = ${record.id}
      `;
      return { record, updated: true };
    }

    await sql`
      INSERT INTO rsvps (
        id, contact_name, guest_id, guest_group, phone, attending, guests, children, message, created_at
      )
      VALUES (
        ${record.id},
        ${record.contactName},
        ${record.guestId ?? null},
        ${record.group ?? null},
        ${record.phone ?? null},
        ${record.attending},
        ${JSON.stringify(record.guests)},
        ${JSON.stringify(record.children ?? [])},
        ${record.message ?? null},
        ${record.createdAt}
      )
    `;
    return { record, updated: false };
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Banco Neon não configurado na Vercel. Ligue o Storage (Neon) e faça um redeploy.",
    );
  }

  await ensureLocalFile();
  const raw = await fs.readFile(localPath, "utf8");
  const list = JSON.parse(raw) as RsvpRecord[];

  if (existing) {
    const next = list.map((item) => (item.id === record.id ? record : item));
    await fs.writeFile(localPath, JSON.stringify(next, null, 2), "utf8");
    return { record, updated: true };
  }

  list.unshift(record);
  await fs.writeFile(localPath, JSON.stringify(list, null, 2), "utf8");
  return { record, updated: false };
}

export async function listRsvps(): Promise<RsvpRecord[]> {
  if (hasDatabase()) {
    await ensureNeonTable();
    const sql = sqlClient();
    const rows = await sql`
      SELECT id, contact_name, guest_id, guest_group, phone, attending, guests, children, message, created_at
      FROM rsvps
      ORDER BY created_at DESC
    `;
    return rows.map((row) => toRecord(row as Record<string, unknown>));
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Banco Neon não configurado na Vercel. Ligue o Storage (Neon) e faça um redeploy.",
    );
  }

  await ensureLocalFile();
  const raw = await fs.readFile(localPath, "utf8");
  const list = JSON.parse(raw) as RsvpRecord[];
  return list.map((item) => ({
    ...item,
    guests: item.guests ?? [],
    children: item.children ?? [],
  }));
}
