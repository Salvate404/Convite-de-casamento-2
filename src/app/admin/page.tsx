"use client";

import { FormEvent, useMemo, useState } from "react";
import type { RsvpRecord } from "@/lib/rsvp-types";

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [rsvps, setRsvps] = useState<RsvpRecord[]>([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const totals = useMemo(() => {
    const yes = rsvps.filter((r) => r.attending === "yes");
    const no = rsvps.filter((r) => r.attending === "no");
    const heads = yes.reduce((sum, r) => sum + r.guests.length, 0);
    return { responses: rsvps.length, yes: yes.length, no: no.length, heads };
  }, [rsvps]);

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
    const header = ["Data", "Contato", "Telefone", "Status", "Convidados", "Mensagem"];
    const rows = rsvps.map((r) => [
      new Date(r.createdAt).toLocaleString("pt-BR"),
      r.contactName,
      r.phone || "",
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
        <p>Anne & Vinicius — painel simples de RSVP</p>

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
              <div>
                <strong>{totals.responses}</strong>
                <span>respostas</span>
              </div>
              <div>
                <strong>{totals.yes}</strong>
                <span>confirmados</span>
              </div>
              <div>
                <strong>{totals.heads}</strong>
                <span>pessoas</span>
              </div>
              <div>
                <strong>{totals.no}</strong>
                <span>não vão</span>
              </div>
            </div>

            <div className="admin-actions">
              <button type="button" className="btn-primary" onClick={() => load()}>
                Atualizar
              </button>
              <button type="button" className="btn-ghost" onClick={exportCsv}>
                Exportar CSV
              </button>
            </div>

            <div className="admin-list">
              {rsvps.length === 0 && <p>Nenhuma confirmação ainda.</p>}
              {rsvps.map((rsvp) => (
                <article key={rsvp.id} className="admin-item">
                  <header>
                    <h2>{rsvp.contactName}</h2>
                    <span className={rsvp.attending === "yes" ? "yes" : "no"}>
                      {rsvp.attending === "yes" ? "Vai" : "Não vai"}
                    </span>
                  </header>
                  <p className="meta">
                    {new Date(rsvp.createdAt).toLocaleString("pt-BR")}
                    {rsvp.phone ? ` · ${rsvp.phone}` : ""}
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
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
