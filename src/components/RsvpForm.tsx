"use client";

import { FormEvent, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollReveal } from "./ScrollReveal";
import { NameSuggest } from "./NameSuggest";
import { adultGuests, childGuests, GROUP_LABELS, type Guest, type GuestGroup } from "@/lib/guests";

type Status = "idle" | "loading" | "success" | "error";

type ChildEntry = {
  name: string;
  guestId?: string;
  custom?: boolean;
};

const emptyChild = (): ChildEntry => ({ name: "" });

export function RsvpForm() {
  const [contactName, setContactName] = useState("");
  const [guestId, setGuestId] = useState("");
  const [group, setGroup] = useState<GuestGroup | "">("");
  const [attending, setAttending] = useState<"yes" | "no" | "">("");
  const [children, setChildren] = useState<ChildEntry[]>([emptyChild()]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const selectedChildIds = useMemo(
    () => children.map((child) => child.guestId).filter((id): id is string => Boolean(id)),
    [children],
  );

  function selectAdult(guest: Guest) {
    setContactName(guest.name);
    setGuestId(guest.id);
    setGroup(guest.group);
  }

  function updateChild(index: number, next: ChildEntry, appendEmpty = false) {
    setChildren((prev) => {
      const updated = prev.map((child, i) => (i === index ? next : child));
      if (appendEmpty && updated.every((child) => child.name.trim())) {
        return [...updated, emptyChild()];
      }
      return updated;
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

    if (!attending) {
      setError("Selecione se poderá comparecer.");
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

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setStatus("error");
        setError(data.error || "Algo deu errado.");
        return;
      }

      setStatus("success");
      setContactName("");
      setGuestId("");
      setGroup("");
      setAttending("");
      setChildren([emptyChild()]);
      setMessage("");
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
          Digite seu nome — se houver mais de uma pessoa com o mesmo nome, escolha a
          família ou o grupo certo. Crianças vão em um campo à parte.
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
              <h3>Obrigado!</h3>
              <p>Sua confirmação foi recebida. Mal podemos esperar para celebrar com você.</p>
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
                placeholder="Comece a digitar seu nome"
                onChange={(value) => {
                  setContactName(value);
                  setGuestId("");
                  setGroup("");
                }}
                onSelect={selectAdult}
              />
              {group && (
                <p className="name-suggest-picked">
                  {contactName} · {GROUP_LABELS[group]}
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
                        excludeIds={selectedChildIds.filter((id) => id !== child.guestId)}
                        placeholder="Comece a digitar o nome"
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
                {status === "loading" ? "Enviando..." : "Enviar confirmação"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </ScrollReveal>
    </section>
  );
}
