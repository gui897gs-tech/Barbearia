import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowRight, Calendar, Loader2, Sparkles, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { formatCurrency } from "@/shared/utils/format";
import {
  AppointmentRecord,
  cancelClientAppointment,
  EmployeeRecord,
  listClientAppointments,
  listEmployees,
  listServices,
  ServiceRecord,
} from "@/data/repositories/business-repository";
import { useAuth } from "@/features/auth/auth-context";
import { notifyError, notifySuccess } from "@/shared/notifications/toast";

export const Route = createFileRoute("/client/")({
  head: () => ({ meta: [{ title: "King's Barber — Sua agenda" }] }),
  component: ClientDashboard,
});

function ClientDashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [barbers, setBarbers] = useState<EmployeeRecord[]>([]);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoading(true);
    void Promise.all([listClientAppointments(user.id), listEmployees(), listServices()])
      .then(([appointmentRows, employeeRows, serviceRows]) => {
        if (!active) return;
        setAppointments(appointmentRows);
        setBarbers(employeeRows.filter((employee) => employee.active !== false));
        setServices(serviceRows.filter((service) => service.active !== false));
      })
      .catch(notifyError)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const upcoming = useMemo(
    () =>
      appointments
        .filter(
          (appointment) =>
            appointment.status === "Confirmado" &&
            appointmentDate(appointment).getTime() > Date.now(),
        )
        .sort((a, b) => appointmentDate(a).getTime() - appointmentDate(b).getTime())[0],
    [appointments],
  );
  const completed = appointments.filter(
    (appointment) => appointment.status === "Concluído" || appointment.status === "Concluido",
  );
  const firstName = String(user?.user_metadata?.full_name || "Cliente").split(" ")[0];

  async function handleCancel() {
    if (!upcoming || !user) return;
    setCanceling(true);
    try {
      await cancelClientAppointment(upcoming.id, user.id);
      setAppointments((items) =>
        items.map((item) =>
          item.id === upcoming.id ? { ...item, status: "Cancelado pelo cliente" } : item,
        ),
      );
      notifySuccess("Agendamento cancelado.");
    } catch (error) {
      notifyError(error);
    } finally {
      setCanceling(false);
    }
  }

  return (
    <AppShell role="client">
      <PageHeader
        eyebrow={`Bem-vindo, ${firstName}`}
        title="Seu próximo corte começa aqui."
        subtitle="Consulte sua agenda e reserve um horário sem precisar ligar."
        action={
          <Link
            to="/client/book"
            className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2.5 text-sm font-medium text-primary-foreground gold-glow"
          >
            <Sparkles className="h-4 w-4" /> Agendar agora
          </Link>
        }
      />

      {loading ? (
        <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-gold" /> Carregando sua agenda
        </div>
      ) : (
        <>
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(17rem,0.7fr)]">
            <section className="glass-card relative overflow-hidden rounded-3xl p-6 sm:p-8">
              <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[color:var(--gold)]/10 blur-3xl" />
              <div className="relative">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">
                  Próximo agendamento
                </div>
                {upcoming ? (
                  <>
                    <h2 className="mt-3 max-w-xl font-display text-3xl sm:text-4xl">
                      {upcoming.service} com {upcoming.barber}
                    </h2>
                    <p className="mt-2 text-sm capitalize text-muted-foreground sm:text-base">
                      {formatAppointment(upcoming)}
                    </p>
                    <div className="mt-7 flex flex-wrap items-center gap-3">
                      <Link
                        to="/client/book"
                        className="rounded-xl gradient-gold px-4 py-2.5 text-sm font-medium text-primary-foreground"
                      >
                        Escolher outro horário
                      </Link>
                      <button
                        type="button"
                        onClick={handleCancel}
                        disabled={canceling}
                        className="inline-flex items-center gap-2 rounded-xl border border-destructive/35 px-4 py-2.5 text-sm text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                      >
                        {canceling && <Loader2 className="h-4 w-4 animate-spin" />}
                        Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-8">
                    <h2 className="font-display text-3xl">Sua agenda está livre.</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Escolha um profissional e reserve o melhor horário para você.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="glass-card rounded-3xl p-6">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
                <UserRound className="h-3.5 w-3.5" /> Equipe disponível
              </div>
              {barbers[0] ? (
                <>
                  <img
                    src={barbers[0].image}
                    alt={`Foto de ${barbers[0].name}`}
                    className="mx-auto mt-6 h-24 w-24 rounded-full object-cover ring-2 ring-[color:var(--gold)]/45"
                  />
                  <div className="mt-3 text-center font-display text-xl">{barbers[0].name}</div>
                  <div className="text-center text-xs text-muted-foreground">
                    {barbers[0].title}
                  </div>
                  <Link
                    to="/client/book"
                    className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-[color:var(--gold)]/35 py-2.5 text-xs text-gold transition hover:bg-[color:var(--gold)]/10"
                  >
                    Ver horários <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              ) : (
                <p className="mt-6 text-sm text-muted-foreground">
                  Nenhum profissional disponível.
                </p>
              )}
            </section>
          </div>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-2xl">Serviços disponíveis</h2>
              <Link to="/client/book" className="text-xs font-medium text-gold">
                Ver agenda
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {services.slice(0, 4).map((service) => (
                <Link
                  to="/client/book"
                  key={service.id}
                  className="glass-card group rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-[color:var(--gold)]/45"
                >
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">
                    {service.category}
                  </div>
                  <h3 className="mt-2 font-display text-xl">{service.name}</h3>
                  <div className="mt-5 flex items-end justify-between">
                    <div className="font-display text-2xl text-gradient-gold">
                      {formatCurrency(service.price)}
                    </div>
                    <div className="text-xs text-muted-foreground">{service.duration} min</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="glass-card rounded-2xl p-6">
              <h2 className="mb-4 flex items-center gap-2 font-display text-xl">
                <Calendar className="h-4 w-4 text-gold" /> Atividade recente
              </h2>
              {appointments.length ? (
                <div className="divide-y divide-border">
                  {appointments.slice(0, 3).map((appointment) => (
                    <div
                      key={appointment.id}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-medium">{appointment.service}</div>
                        <div className="text-xs capitalize text-muted-foreground">
                          {formatAppointment(appointment)}
                        </div>
                      </div>
                      <div className="text-sm text-gold">{formatCurrency(appointment.price)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
              )}
            </section>

            <section className="glass-card rounded-2xl p-6">
              <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">
                Seu histórico
              </div>
              <div className="mt-5">
                <Metric label="Visitas concluídas" value={String(completed.length)} />
              </div>
              <Link
                to="/client/history"
                className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-gold"
              >
                Abrir histórico <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </section>
          </div>
        </>
      )}
    </AppShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background/35 p-4">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 font-display text-2xl">{value}</div>
    </div>
  );
}

function appointmentDate(appointment: AppointmentRecord) {
  if (appointment.starts_at) return new Date(appointment.starts_at);
  const [year, month, day] = (appointment.appointment_date ?? "").split("-").map(Number);
  const [hours, minutes] = appointment.time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

function formatAppointment(appointment: AppointmentRecord) {
  const value = appointmentDate(appointment);
  if (Number.isNaN(value.getTime()))
    return `${appointment.appointment_date ?? "Data pendente"} · ${appointment.time}`;
  return format(value, "EEEE, dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
}
