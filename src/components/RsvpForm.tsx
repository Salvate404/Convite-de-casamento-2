"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";
import { NameSuggest } from "./NameSuggest";
import { adultGuests, childGuests, GROUP_LABELS, type Guest, type GuestGroup } from "@/lib/guests";
import type { RsvpRecord } from "@/lib/rsvp-types";

type Status = "idle" | "loading" | "success" | "error";

type ChildEntry = {
  name: string;
  guestId?: string;
  custom?: boolean;
};

const emptyChild = (): ChildEntry => ({ name: "" });

function childrenFromRecord(record: RsvpRecord): ChildEntry[] {
  const listed = (record.children ?? []).map((child) => ({
    name: child.name,
    guestId: child.guestId,
    custom: child.custom,
  }));
  return listed.length ? [...listed, emptyChild()] : [emptyChild()];
}

export function RsvpForm() {
  const [contactName, setContactName] = useState("");
  const [guestId, setGuestId] = useState("");
  const [group, setGroup] = useState<GuestGroup | "">("");
  const [attending, setAttending] = useState<"yes" | "no" | "">("");
  const [children, setChildren] = useState<ChildEntry[]>([emptyChild()]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [existing, setExisting] = useState(false);
  const [updated, setUpdated] = useState(false);

  const selectedChildIds = useMemo(
    () => children.map((child) => child.guestId).filter((id): id is string => Boolean(id)),
    [children],
  );

  async function selectAdult(guest: Guest) {
    setContactName(guest.name);
    setGuestId(guest.id);
    setGroup(guest.group);
    setError("");

    try {
      const response = await fetch(`/api/rsvp?guestId=${encodeURIComponent(guest.id)}`);
      const data = (await response.json()) as { rsvp?: RsvpRecord | null };
      if (data.rsvp) {
        setExisting(true);
        setAttending(data.rsvp.attending);
        setMessage(data.rsvp.message || "");
        setChildren(childrenFromRecord(data.rsvp));
        return;
      }
    } catch {
      // segue como nova confirmação
    }

    setExisting(false);
    setAttending("");
    setMessage("");
    setChildren([emptyChild()]);
  }

  function updateChild(index: number, next: ChildEntry, appendEmpty = false) {
    setChildren((prev) => {
      const updatedRows = prev.map((child, i) => (i === index ? next : child));
      if (appendEmpty && updatedRows.every((child) => child.name.trim())) {
        return [...updatedRows, emptyChild()];
      }
      return updatedRows;
    });
  }

  function removeChild(index: number) {
    setChildren((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length ? next : [emptyChild()];
    });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!guestId) {
      setError("Clique no seu nome na lista para confirmar.");
      return;
    }

    if (!attending) {
      setError("Selecione se poderá comparecer.");
      return;
    }

    const unfinishedChild = children.find(
      (child) => child.name.trim() && !child.guestId && !child.custom,
    );
    if (unfinishedChild) {
      setError("Clique no nome da criança na lista, ou em + adicionar criança.");
      return;
    }

    setStatus("loading");

    const childPayload = children
      .map((child) => ({
        name: child.name.trim(),
        guestId: child.guestId,
        custom: child.custom,
      }))
      .filter((child) => child.name);

    try {
      const response = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactName,
          guestId: guestId || undefined,
          group: group || undefined,
          attending,
          children: attending === "yes" ? childPayload : [],
          message,
        }),
      });

      const data = (await response.json()) as { error?: string; updated?: boolean };

      if (!response.ok) {
        setStatus("error");
        setError(data.error || "Algo deu errado.");
        return;
      }

      setUpdated(Boolean(data.updated));
      setStatus("success");
      setContactName("");
      setGuestId("");
      setGroup("");
      setAttending("");
      setChildren([emptyChild()]);
      setMessage("");
      setExisting(false);
    } catch {
      setStatus("error");
      setError("Falha de conexão. Tente novamente.");
    }
  }

  return (
    <section id="rsvp" className="section rsvp">
      <ScrollReveal>
        <div className="section-ornament" aria-hidden>
          <span />
          <span className="section-ornament-dot" />
          <span />
        </div>
        <p className="section-label">RSVP</p>
        <h2 className="section-title">Confirme sua presença</h2>
        <p className="section-text">
          Digite e clique no seu nome da lista — só assim a confirmação vale.
          Se houver nomes iguais, escolha o grupo certo. Crianças vão em um
          campo à parte.
        </p>
      </ScrollReveal>

      <ScrollReveal delay={0.1} className="rsvp-wrap">
        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              className="rsvp-success"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <h3>{updated ? "Resposta atualizada" : "Obrigado!"}</h3>
              <p>
                {updated
                  ? "Sua confirmação anterior foi substituída pela nova resposta."
                  : "Sua confirmação foi recebida. Mal podemos esperar para celebrar com você."}
              </p>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setStatus("idle")}
              >
                Enviar outra resposta
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              className="rsvp-form"
              onSubmit={onSubmit}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
            >
              <NameSuggest
                label="Seu nome"
                value={contactName}
                guests={adultGuests}
                required
                selected={Boolean(guestId)}
                placeholder="Comece a digitar e clique no seu nome"
                onChange={(value) => {
                  setContactName(value);
                  setGuestId("");
                  setGroup("");
                  setExisting(false);
                }}
                onSelect={selectAdult}
              />
              {group && (
                <p className="name-suggest-picked">
                  {contactName} · {GROUP_LABELS[group]}
                </p>
              )}
              {existing && (
                <p className="rsvp-existing">
                  Você já confirmou. Altere a resposta abaixo e envie de novo.
                </p>
              )}

              <fieldset className="field attending">
                <legend>Você poderá comparecer?</legend>
                <div className="attending-options" role="group">
                  <button
                    type="button"
                    className={`attend-btn${attending === "yes" ? " is-active" : ""}`}
                    aria-pressed={attending === "yes"}
                    onClick={() => setAttending("yes")}
                  >
                    <span>Sim</span>
                    <small>Estarei lá</small>
                  </button>
                  <button
                    type="button"
                    className={`attend-btn attend-no${attending === "no" ? " is-active" : ""}`}
                    aria-pressed={attending === "no"}
                    onClick={() => setAttending("no")}
                  >
                    <span>Não</span>
                    <small>Não poderei ir</small>
                  </button>
                </div>
              </fieldset>

              <div className="guests">
                <div className="guests-head">
                  <span>Crianças</span>
                </div>
                <p className="field-hint">
                  Se vier com crianças, busque o nome na lista. Não encontrou? Use +
                  adicionar criança.
                </p>

                {children.map((child, index) => (
                  <div key={index} className="guest-row">
                    <div className="grow">
                      <NameSuggest
                        label={index === 0 ? "Nome da criança" : `Criança ${index + 1}`}
                        value={child.name}
                        guests={childGuests}
                        selected={Boolean(child.guestId || child.custom)}
                        excludeIds={selectedChildIds.filter((id) => id !== child.guestId)}
                        placeholder="Digite e clique no nome da lista"
                        customActionLabel="+ Adicionar criança"
                        onChange={(value) =>
                          updateChild(index, { name: value, guestId: undefined, custom: false })
                        }
                        onSelect={(guest) =>
                          updateChild(
                            index,
                            {
                              name: guest.name,
                              guestId: guest.id,
                              custom: false,
                            },
                            true,
                          )
                        }
                        onCustomAction={(name) =>
                          updateChild(index, { name, custom: true }, true)
                        }
                      />
                    </div>
                    {(children.length > 1 || child.name) && (
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => removeChild(index)}
                        aria-label={`Remover criança ${index + 1}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <label className="field">
                <span>Mensagem para os noivos (opcional)</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  placeholder="Deixe um carinho..."
                />
              </label>

              {error && <p className="form-error">{error}</p>}

              <button
                type="submit"
                className="btn-primary"
                disabled={status === "loading"}
              >
                {status === "loading"
                  ? existing
                    ? "Atualizando..."
                    : "Enviando..."
                  : existing
                    ? "Atualizar resposta"
                    : "Enviar confirmação"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </ScrollReveal>
    </section>
  );
}
