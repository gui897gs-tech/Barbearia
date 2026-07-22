import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { fmtBRL } from "@/lib/sample-data";
import { EmployeeRecord, listAppointments, listEmployees, saveAppointment } from "@/lib/business-data";
import {
  Appointment,
  AppointmentDialog,
} from "@/components/AppointmentDialog";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

export const Route = createFileRoute("/owner/appointments")({
  head: () => ({ meta: [{ title: "Agendamentos - Maison Lame" }] }),
  component: AppointmentsPage,
});

function AppointmentsPage() {
  const hours = Array.from({ length: 10 }, (_, i) => `${9 + i}:00`);
  const [appointmentList, setAppointmentList] = useState<Appointment[]>([]);
  const [barbers, setBarbers] = useState<EmployeeRecord[]>([]);
  const [addingAppointment, setAddingAppointment] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 4, 21));

  useEffect(() => {
    listAppointments(selectedDate.toISOString().slice(0, 10)).then(setAppointmentList);
  }, [selectedDate]);

  useEffect(() => {
    listEmployees().then((items) => setBarbers(items.filter((barber) => barber.active !== false)));
  }, []);

  async function handleCreate(appointment: Appointment) {
    const saved = await saveAppointment({
      ...appointment,
      appointment_date: selectedDate.toISOString().slice(0, 10),
    });
    const nextAppointments = [...appointmentList, saved].sort((a, b) => a.time.localeCompare(b.time));
    setAppointmentList(nextAppointments);
    setAddingAppointment(false);
  }

  function changeDay(offset: number) {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() + offset);
      return next;
    });
  }

  const selectedDateLabel = selectedDate.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <AppShell role="owner">
      <PageHeader
        eyebrow="Agenda"
        title="Agendamentos"
        subtitle="Uma coreografia de cadeiras, maos e horarios."
        action={
          <button
            type="button"
            onClick={() => setAddingAppointment(true)}
            className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2.5 text-sm font-medium text-primary-foreground gold-glow"
          >
            <Plus className="h-4 w-4" /> Novo agendamento
          </button>
        }
      />

      <div className="glass-card rounded-2xl p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => changeDay(-1)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:border-[color:var(--gold)]/50 hover:text-gold transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="font-display text-lg px-3 capitalize">{selectedDateLabel}</div>
            <button
              type="button"
              onClick={() => changeDay(1)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-border hover:border-[color:var(--gold)]/50 hover:text-gold transition"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input placeholder="Buscar cliente" className="rounded-xl bg-card border border-border pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-[color:var(--gold)]" />
          </div>
        </div>

        <div className="overflow-x-auto scrollbar-none">
          <div className="min-w-[760px] grid" style={{ gridTemplateColumns: `80px repeat(${Math.max(barbers.length, 1)}, minmax(160px,1fr))` }}>
            <div />
            {barbers.length === 0 && (
              <div className="px-3 pb-4 border-b border-border text-sm text-muted-foreground">
                Nenhum barbeiro cadastrado
              </div>
            )}
            {barbers.map((barber) => (
              <div key={barber.id} className="px-3 pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <img src={barber.image} alt={barber.name} className="h-8 w-8 rounded-full object-cover ring-1 ring-[color:var(--gold)]/40" />
                  <div>
                    <div className="text-sm font-medium">{barber.name.split(" ")[0]}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{barber.title}</div>
                  </div>
                </div>
              </div>
            ))}

            {hours.map((hour) => (
              <Fragment key={hour}>
                <div className="text-xs text-muted-foreground pr-3 py-6 border-b border-border/40 text-right">{hour}</div>
                {barbers.map((barber) => {
                  const appointment = appointmentList.find((item) => item.time === hour && item.barber === barber.name);
                  return (
                    <div key={`${hour}-${barber.id}`} className="border-b border-l border-border/40 p-1.5 min-h-[72px]">
                      {appointment && (
                        <div className="rounded-xl bg-gradient-to-br from-[color:var(--gold)]/15 to-transparent border border-[color:var(--gold)]/30 p-2.5 h-full hover:gold-glow transition cursor-pointer">
                          <div className="text-xs text-gold">{appointment.service}</div>
                          <div className="text-sm font-medium truncate mt-0.5">{appointment.client}</div>
                          <div className="text-[10px] text-muted-foreground mt-1">{fmtBRL(appointment.price)}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </Fragment>
            ))}
          </div>
        </div>
      </div>

      {addingAppointment && (
        <AppointmentDialog
          onClose={() => setAddingAppointment(false)}
          onSave={handleCreate}
        />
      )}
    </AppShell>
  );
}
