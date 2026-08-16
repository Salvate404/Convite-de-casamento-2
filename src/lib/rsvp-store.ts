import { neon } from "@neondatabase/serverless";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { RsvpPayload, RsvpRecord } from "./rsvp-types";

const localPath = path.join(process.cwd(), "data", "rsvps.json");

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
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
  const sql = neon(process.env.DATABASE_URL!);
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
}

export async function createRsvp(payload: RsvpPayload): Promise<RsvpRecord> {
  const record: RsvpRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...payload,
  };

  if (hasDatabase()) {
    await ensureNeonTable();
    const sql = neon(process.env.DATABASE_URL!);
    await sql`
      INSERT INTO rsvps (id, contact_name, phone, attending, guests, message, created_at)
      VALUES (
        ${record.id},
        ${record.contactName},
        ${record.phone ?? null},
        ${record.attending},
        ${JSON.stringify(record.guests)},
        ${record.message ?? null},
        ${record.createdAt}
      )
    `;
    return record;
  }

  await ensureLocalFile();
  const raw = await fs.readFile(localPath, "utf8");
  const list = JSON.parse(raw) as RsvpRecord[];
  list.unshift(record);
  await fs.writeFile(localPath, JSON.stringify(list, null, 2), "utf8");
  return record;
}

export async function listRsvps(): Promise<RsvpRecord[]> {
  if (hasDatabase()) {
    await ensureNeonTable();
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT id, contact_name, phone, attending, guests, message, created_at
      FROM rsvps
      ORDER BY created_at DESC
    `;

    return rows.map((row) => ({
      id: String(row.id),
      contactName: String(row.contact_name),
      phone: row.phone ? String(row.phone) : undefined,
      attending: row.attending as "yes" | "no",
      guests: Array.isArray(row.guests)
        ? (row.guests as string[])
        : (JSON.parse(String(row.guests)) as string[]),
      children: [],
      message: row.message ? String(row.message) : undefined,
      createdAt: new Date(String(row.created_at)).toISOString(),
    }));
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
