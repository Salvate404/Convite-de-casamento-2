"use client";

import { FormEvent, useMemo, useState } from "react";
import type { RsvpRecord } from "@/lib/rsvp-types";
import { adultGuests, GROUP_LABELS, type GuestGroup } from "@/lib/guests";

type Filter = "yes" | "no" | "responded" | "pending";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [rsvps, setRsvps] = useState<RsvpRecord[]>([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<Filter>("responded");

  const respondedIds = useMemo(
    () => new Set(rsvps.map((rsvp) => rsvp.guestId).filter(Boolean)),
    [rsvps],
  );

  const pending = useMemo(
    () => adultGuests.filter((guest) => !respondedIds.has(guest.id)),
    [respondedIds],
  );

  const totals = useMemo(() => {
    const yes = rsvps.filter((r) => r.attending === "yes").length;
    const no = rsvps.filter((r) => r.attending === "no").length;
    return {
      yes,
      no,
      responded: rsvps.length,
      pending: pending.length,
    };
  }, [pending.length, rsvps]);

  const visibleRsvps = useMemo(() => {
    if (filter === "yes") return rsvps.filter((r) => r.attending === "yes");
    if (filter === "no") return rsvps.filter((r) => r.attending === "no");
    return rsvps;
  }, [filter, rsvps]);

  async function load(event?: FormEvent) {
    event?.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/rsvps", {
        headers: { Authorization: `Bearer ${password}` },
      });
      const data = (await response.json()) as { rsvps?: RsvpRecord[]; error?: string };

      if (!response.ok) {
        setError(data.error || "Não autorizado.");
        setLoaded(false);
        return;
      }

      setRsvps(data.rsvps || []);
      setLoaded(true);
    } catch {
      setError("Falha ao carregar.");
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const header = ["Data", "Nome", "Grupo", "Status", "Convidados", "Mensagem"];
    const rows = rsvps.map((r) => [
      new Date(r.createdAt).toLocaleString("pt-BR"),
      r.contactName,
      r.group && r.group in GROUP_LABELS ? GROUP_LABELS[r.group as GuestGroup] : "",
      r.attending === "yes" ? "Sim" : "Não",
      r.guests.join(" | "),
      (r.message || "").replace(/\n/g, " "),
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "confirmacoes-casamento.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="admin">
      <div className="admin-inner">
        <h1>Confirmações</h1>
        <p>Anne & Vinicius — confirmações salvas no banco</p>

        {!loaded ? (
          <form className="admin-login" onSubmit={load}>
            <label className="field">
              <span>Senha</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        ) : (
          <>
            <div className="admin-stats">
              <button
                type="button"
                className={filter === "yes" ? "is-active" : undefined}
                onClick={() => setFilter("yes")}
              >
                <strong>{totals.yes}</strong>
                <span>confirmados</span>
              </button>
              <button
                type="button"
                className={filter === "no" ? "is-active" : undefined}
                onClick={() => setFilter("no")}
              >
                <strong>{totals.no}</strong>
                <span>não vão</span>
              </button>
              <button
                type="button"
                className={filter === "responded" ? "is-active" : undefined}
                onClick={() => setFilter("responded")}
              >
                <strong>{totals.responded}</strong>
                <span>total respondido</span>
              </button>
              <button
                type="button"
                className={filter === "pending" ? "is-active" : undefined}
                onClick={() => setFilter("pending")}
              >
                <strong>{totals.pending}</strong>
                <span>total que falta</span>
              </button>
            </div>

            <div className="admin-actions">
              <button type="button" className="btn-primary" onClick={() => load()}>
                Atualizar
              </button>
              <button type="button" className="btn-ghost" onClick={exportCsv}>
                Exportar CSV
              </button>
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="admin-list">
              {filter === "pending" ? (
                pending.length === 0 ? (
                  <p>Todo mundo da lista já respondeu.</p>
                ) : (
                  pending.map((guest) => (
                    <article key={guest.id} className="admin-item">
                      <header>
                        <h2>{guest.name}</h2>
                        <span className="pending">Pendente</span>
                      </header>
                      <p className="meta">{guest.groupLabel}</p>
                    </article>
                  ))
                )
              ) : visibleRsvps.length === 0 ? (
                <p>Nenhuma confirmação neste filtro.</p>
              ) : (
                visibleRsvps.map((rsvp) => (
                  <article key={rsvp.id} className="admin-item">
                    <header>
                      <h2>{rsvp.contactName}</h2>
                      <span className={rsvp.attending === "yes" ? "yes" : "no"}>
                        {rsvp.attending === "yes" ? "Vai" : "Não vai"}
                      </span>
                    </header>
                    <p className="meta">
                      {new Date(rsvp.createdAt).toLocaleString("pt-BR")}
                      {rsvp.group && rsvp.group in GROUP_LABELS
                        ? ` · ${GROUP_LABELS[rsvp.group as GuestGroup]}`
                        : ""}
                    </p>
                    {rsvp.guests.length > 0 && (
                      <ul>
                        {rsvp.guests.map((guest) => (
                          <li key={guest}>{guest}</li>
                        ))}
                      </ul>
                    )}
                    {rsvp.message && <p className="msg">“{rsvp.message}”</p>}
                  </article>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
