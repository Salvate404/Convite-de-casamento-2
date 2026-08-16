import guestData from "@/data/guests.json";

export type GuestGroup =
  | "familia-noiva"
  | "familia-noivo"
  | "igreja"
  | "amigos-noiva"
  | "amigos-noivo"
  | "criancas";

export type Guest = {
  id: string;
  name: string;
  group: GuestGroup;
  groupLabel: string;
};

export const GROUP_LABELS: Record<GuestGroup, string> = {
  "familia-noiva": "Família da noiva",
  "familia-noivo": "Família do noivo",
  igreja: "Igreja",
  "amigos-noiva": "Amigos da noiva",
  "amigos-noivo": "Amigos do noivo",
  criancas: "Crianças",
};

function slug(value: string) {
  return normalize(value).replace(/\s+/g, "-");
}

function uniqueByName(names: string[]) {
  const seen = new Set<string>();
  return names.filter((name) => {
    const key = normalize(name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function toGuests(group: GuestGroup, names: string[]): Guest[] {
  return uniqueByName(names).map((name) => ({
    id: `${group}-${slug(name)}`,
    name,
    group,
    groupLabel: GROUP_LABELS[group],
  }));
}

export const adultGuests: Guest[] = [
  ...toGuests("familia-noiva", guestData["familia-noiva"]),
  ...toGuests("familia-noivo", guestData["familia-noivo"]),
  ...toGuests("igreja", guestData.igreja),
  ...toGuests("amigos-noiva", guestData["amigos-noiva"]),
  ...toGuests("amigos-noivo", guestData["amigos-noivo"]),
];

export const childGuests: Guest[] = toGuests("criancas", guestData.criancas);

export function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function levenshtein(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return max + 1;

  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  const curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0];

    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }

    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }

  return prev[b.length];
}

function scoreGuest(query: string, name: string) {
  const q = normalize(query);
  const n = normalize(name);
  if (!q) return null;

  if (n === q) return 100;
  if (n.startsWith(q)) return 92;
  if (n.split(" ").some((word) => word.startsWith(q))) return 86;
  if (n.includes(q)) return 74;

  const maxDist = q.length <= 4 ? 1 : 2;
  const whole = levenshtein(n, q, maxDist);
  if (whole <= maxDist) return 64 - whole;

  let best = maxDist + 1;
  for (const word of n.split(" ")) {
    const dist = levenshtein(word, q, maxDist);
    if (dist < best) best = dist;
  }

  if (best <= maxDist) return 56 - best;
  return null;
}

export function searchGuests(query: string, guests: Guest[], limit = 8) {
  const ranked = guests
    .map((guest) => {
      const score = scoreGuest(query, guest.name);
      return score == null ? null : { guest, score };
    })
    .filter((item): item is { guest: Guest; score: number } => item !== null)
    .sort((a, b) => b.score - a.score || a.guest.name.localeCompare(b.guest.name, "pt-BR"));

  return ranked.slice(0, limit).map((item) => item.guest);
}
