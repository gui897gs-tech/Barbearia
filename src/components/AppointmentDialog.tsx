import { FormEvent, useState } from "react";
import { appointments as initialAppointments, barbers, services } from "@/lib/sample-data";
import { X } from "lucide-react";

export type Appointment = (typeof initialAppointments)[number];

export const appointmentStorageKey = "maison-lame-appointments";

export function loadStoredAppointments() {
  if (typeof window === "undefined") return initialAppointments;

  const savedAppointments = window.localStorage.getItem(appointmentStorageKey);
  if (!savedAppointments) return initialAppointments;

  try {
    return JSON.parse(savedAppointments) as Appointment[];
  } catch {
    window.localStorage.removeItem(appointmentStorageKey);
    return initialAppointments;
  }
}

export function saveStoredAppointments(nextAppointments: Appointment[]) {
  window.localStorage.setItem(appointmentStorageKey, JSON.stringify(nextAppointments));
}

export function AppointmentDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (appointment: Appointment) => void;
}) {
  const [time, setTime] = useState("09:00");
  const [client, setClient] = useState("");
  const [serviceName, setServiceName] = useState(services[0]?.name || "");
  const [barber, setBarber] = useState(barbers[0]?.name || "");
  const [status, setStatus] = useState("Confirmado");
  const selectedService = services.find((service) => service.name === serviceName) || services[0];
  const [price, setPrice] = useState(String(selectedService?.price || 0));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSave({
      id: `a-${Date.now()}`,
      time,
      client: client.trim(),
      service: serviceName,
      barber,
      status,
      price: Number(price),
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-gold">Novo agendamento</div>
            <h2 className="font-display mt-1 text-2xl">Dados do horario</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs text-muted-foreground">Cliente</span>
            <input
              required
              value={client}
              onChange={(event) => setClient(event.target.value)}
              className="mt-1 w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-muted-foreground">Horario</span>
              <input
                required
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                className="mt-1 w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
              />
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Valor</span>
              <input
                required
                type="number"
                min="0"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
                className="mt-1 w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs text-muted-foreground">Servico</span>
            <select
              value={serviceName}
              onChange={(event) => {
                const nextService = services.find((service) => service.name === event.target.value);
                setServiceName(event.target.value);
                if (nextService) setPrice(String(nextService.price));
              }}
              className="mt-1 w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
            >
              {services.map((service) => (
                <option key={service.id} value={service.name}>{service.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-muted-foreground">Barbeiro</span>
            <select
              value={barber}
              onChange={(event) => setBarber(event.target.value)}
              className="mt-1 w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
            >
              {barbers.map((item) => (
                <option key={item.id} value={item.name}>{item.name}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-muted-foreground">Status</span>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className="mt-1 w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
            >
              <option>Confirmado</option>
              <option>Pendente</option>
              <option>Concluido</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition">
            Cancelar
          </button>
          <button type="submit" className="flex-1 rounded-xl gradient-gold px-4 py-3 text-sm font-medium text-primary-foreground gold-glow">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
