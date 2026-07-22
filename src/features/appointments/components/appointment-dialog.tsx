import { FormEvent, useEffect, useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  AppointmentRecord,
  EmployeeRecord,
  listEmployees,
  listServices,
  ServiceRecord,
} from "@/data/repositories/business-repository";
import { notifyError } from "@/shared/notifications/toast";

export type Appointment = AppointmentRecord;

export function AppointmentDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (appointment: Appointment) => Promise<void> | void;
}) {
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [barbers, setBarbers] = useState<EmployeeRecord[]>([]);
  const [time, setTime] = useState("09:00");
  const [client, setClient] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [barberId, setBarberId] = useState("");
  const [status, setStatus] = useState("Confirmado");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void Promise.all([listServices(), listEmployees()])
      .then(([serviceRows, employeeRows]) => {
        const activeServices = serviceRows.filter((service) => service.active !== false);
        const activeBarbers = employeeRows.filter((barber) => barber.active !== false);
        setServices(activeServices);
        setBarbers(activeBarbers);
        setServiceId(activeServices[0]?.id ?? "");
        setBarberId(activeBarbers[0]?.id ?? "");
      })
      .catch(notifyError)
      .finally(() => setLoading(false));
  }, []);

  const selectedService = useMemo(
    () => services.find((service) => service.id === serviceId),
    [serviceId, services],
  );
  const selectedBarber = useMemo(
    () => barbers.find((barber) => barber.id === barberId),
    [barberId, barbers],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedService || !selectedBarber) return;
    setSaving(true);
    try {
      await onSave({
        id: crypto.randomUUID(),
        time,
        client: client.trim(),
        service: selectedService.name,
        barber: selectedBarber.name,
        status,
        price: selectedService.price,
        service_id: selectedService.id,
        barber_id: selectedBarber.id,
        duration_minutes: selectedService.duration,
        notes: notes.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  const unavailable = loading || !services.length || !barbers.length;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/70 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="appointment-dialog-title"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
              Novo agendamento
            </div>
            <h2 id="appointment-dialog-title" className="mt-1 font-display text-2xl">
              Reservar uma cadeira
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground transition hover:text-foreground"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-gold" /> Carregando equipe e serviços
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {unavailable ? (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Cadastre ao menos um serviço e um barbeiro ativo antes de criar agendamentos.
              </p>
            ) : null}
            <Field label="Cliente">
              <input
                required
                value={client}
                onChange={(event) => setClient(event.target.value)}
                autoFocus
                className="profile-input mt-1"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Horário">
                <input
                  required
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  className="profile-input mt-1"
                />
              </Field>
              <Field label="Status">
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="profile-input mt-1"
                >
                  <option>Confirmado</option>
                  <option>Pendente</option>
                </select>
              </Field>
            </div>

            <Field label="Serviço">
              <select
                required
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                className="profile-input mt-1"
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} · {service.duration} min · R$ {service.price}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Barbeiro">
              <select
                required
                value={barberId}
                onChange={(event) => setBarberId(event.target.value)}
                className="profile-input mt-1"
              >
                {barbers.map((barber) => (
                  <option key={barber.id} value={barber.id}>
                    {barber.name} · {barber.title}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Observações (opcional)">
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={500}
                rows={3}
                className="profile-input mt-1 resize-none"
              />
            </Field>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground transition hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={unavailable || saving || client.trim().length < 2}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl gradient-gold px-4 py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Salvando" : "Criar agendamento"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
