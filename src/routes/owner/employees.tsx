import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import {
  AppointmentRecord,
  deleteEmployee,
  EmployeeRecord,
  listAppointments,
  listEmployees,
  saveEmployee,
} from "@/data/repositories/business-repository";
import { supabase } from "@/integrations/supabase/client";
import {
  CheckCircle2,
  KeyRound,
  Mail,
  Phone,
  Plus,
  ShieldCheck,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { notifyError, notifySuccess } from "@/shared/notifications/toast";
import { formatCurrency, isCompletedStatus } from "@/shared/utils/format";

type Employee = EmployeeRecord;
const defaultImage = "";

export const Route = createFileRoute("/owner/employees")({
  head: () => ({ meta: [{ title: "Equipe - King's Barber" }] }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [profileEmployee, setProfileEmployee] = useState<Employee | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);

  useEffect(() => {
    void Promise.all([listEmployees(), listAppointments()])
      .then(([employeeRows, appointmentRows]) => {
        setEmployees(employeeRows);
        setAppointments(appointmentRows);
      })
      .catch(notifyError);
  }, []);

  async function handleCreate(employee: Employee) {
    try {
      const saved = await saveEmployee(employee);
      setEmployees((items) => [...items, saved]);
      setAddingEmployee(false);
      notifySuccess("Profissional adicionado.");
    } catch (error) {
      notifyError(error);
    }
  }

  async function handleDelete(employee: Employee) {
    if (!window.confirm(`Excluir o perfil profissional de ${employee.name}?`)) return;
    try {
      await deleteEmployee(employee.id);
      setEmployees((items) => items.filter((item) => item.id !== employee.id));
      if (profileEmployee?.id === employee.id) {
        setProfileEmployee(null);
      }
      notifySuccess("Profissional excluído.");
    } catch (error) {
      notifyError(error);
    }
  }

  return (
    <AppShell role="owner">
      <PageHeader
        eyebrow="Talentos"
        title="Equipe"
        subtitle="As mãos por trás de cada corte. Gerencie perfis, acessos e comissões."
        action={
          <button
            type="button"
            onClick={() => setAddingEmployee(true)}
            className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2.5 text-sm font-medium text-primary-foreground gold-glow"
          >
            <Plus className="h-4 w-4" /> Adicionar barbeiro
          </button>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {employees.map((barber) => {
          const performance = getPerformance(barber, appointments);
          return (
            <div
              key={barber.id}
              className="glass-card rounded-2xl p-6 text-center group hover:gold-glow transition"
            >
              <div className="relative inline-block">
                {barber.image ? (
                  <img
                    src={barber.image}
                    alt={barber.name}
                    className="h-24 w-24 rounded-full object-cover mx-auto ring-2 ring-[color:var(--gold)]/40 group-hover:ring-[color:var(--gold)] transition"
                  />
                ) : (
                  <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-accent font-display text-3xl text-gold ring-2 ring-gold/40">
                    {barber.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-card border border-[color:var(--gold)]/40">
                  <Star className="h-3.5 w-3.5 text-gold fill-current" />
                </div>
              </div>
              <div className="mt-4 font-display text-lg">{barber.name}</div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {barber.title}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-left">
                <div className="rounded-xl bg-accent/40 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Faturamento
                  </div>
                  <div className="text-gold text-sm font-medium mt-1">
                    {formatCurrency(performance.revenue)}
                  </div>
                </div>
                <div className="rounded-xl bg-accent/40 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Atend.
                  </div>
                  <div className="text-sm font-medium mt-1">{performance.appointments}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setProfileEmployee(barber)}
                className="mt-4 w-full rounded-xl border border-border py-2 text-xs text-muted-foreground hover:border-[color:var(--gold)]/50 hover:text-foreground transition"
              >
                Ver perfil
              </button>
              <button
                type="button"
                onClick={() => handleDelete(barber)}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2 text-xs text-muted-foreground hover:border-destructive/50 hover:text-destructive transition"
              >
                <Trash2 className="h-3.5 w-3.5" /> Excluir
              </button>
            </div>
          );
        })}
      </div>

      {addingEmployee && (
        <AddEmployeeDialog onClose={() => setAddingEmployee(false)} onSave={handleCreate} />
      )}

      {profileEmployee && (
        <EmployeeProfileDialog
          employee={profileEmployee}
          appointments={appointments}
          onClose={() => setProfileEmployee(null)}
        />
      )}
    </AppShell>
  );
}

function AddEmployeeDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (employee: Employee) => void;
}) {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("Barbeiro");
  const [image, setImage] = useState("");
  const [commissionRate, setCommissionRate] = useState("30");
  const [email, setEmail] = useState("");
  const [createAccess, setCreateAccess] = useState(true);
  const [loading, setLoading] = useState(false);
  const [accessMessage, setAccessMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setAccessMessage("");

    if (createAccess) {
      if (!email.trim()) {
        setError("Informe o e-mail do barbeiro para criar o acesso.");
        return;
      }
    }

    setLoading(true);
    let accessUserId: string | undefined;
    let createdBarberId: string | undefined;
    let accessStatus: Employee["accessStatus"] = createAccess ? "pending" : "local";

    if (createAccess && supabase) {
      const { data, error: functionError } = await supabase.functions.invoke("create-barber", {
        body: {
          name: name.trim(),
          email: email.trim(),
          title: title.trim(),
          image: image.trim() || defaultImage,
          commissionRate: Number(commissionRate),
        },
      });

      if (functionError) {
        accessStatus = "pending";
        setAccessMessage(
          "O perfil será salvo, mas o convite não pôde ser enviado. Verifique a Edge Function e tente novamente depois.",
        );
      } else {
        accessUserId = data?.user?.id;
        createdBarberId = data?.barber?.id;
        accessStatus = "pending";
        setAccessMessage("Convite enviado. O barbeiro definirá a própria senha pelo e-mail.");
      }
    }

    if (createAccess && !supabase) {
      setAccessMessage("Barbeiro salvo no painel. Configure o Supabase para criar o login real.");
    }

    onSave({
      id: createdBarberId || crypto.randomUUID(),
      name: name.trim(),
      title: title.trim(),
      image: image.trim() || defaultImage,
      rating: 5,
      revenue: 0,
      appts: 0,
      commission: 0,
      commissionRate: Number(commissionRate),
      email: email.trim() || undefined,
      accessStatus,
      accessUserId,
    });

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6 md:py-10">
      <form
        onSubmit={handleSubmit}
        className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <DialogHeader eyebrow="Adicionar barbeiro" title="Novo talento" onClose={onClose} />

        <div className="mt-6 space-y-4">
          <TextField label="Nome" value={name} onChange={setName} required />
          <TextField label="Cargo" value={title} onChange={setTitle} required />
          <TextField label="URL da foto" value={image} onChange={setImage} />

          <TextField
            label="Taxa de comissão (%)"
            value={commissionRate}
            onChange={setCommissionRate}
            type="number"
            min="0"
            max="100"
            required
          />

          <div className="rounded-2xl border border-[color:var(--gold)]/25 bg-[color:var(--gold)]/5 p-4">
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={createAccess}
                onChange={(event) => setCreateAccess(event.target.checked)}
                className="mt-1 h-4 w-4 accent-[color:var(--gold)]"
              />
              <span>
                <span className="block font-medium text-foreground">Criar acesso de barbeiro</span>
                <span className="text-xs text-muted-foreground">
                  Um convite será enviado por e-mail para o profissional definir a própria senha.
                </span>
              </span>
            </label>

            {createAccess && (
              <div className="mt-4 space-y-3">
                <TextField
                  label="E-mail de acesso"
                  value={email}
                  onChange={setEmail}
                  type="email"
                  required
                />
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}
          {accessMessage && (
            <div className="rounded-xl border border-[color:var(--gold)]/40 bg-accent/40 p-3 text-xs text-muted-foreground">
              {accessMessage}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl gradient-gold px-4 py-3 text-sm font-medium text-primary-foreground gold-glow disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function EmployeeProfileDialog({
  employee,
  appointments,
  onClose,
}: {
  employee: Employee;
  appointments: AppointmentRecord[];
  onClose: () => void;
}) {
  const performance = getPerformance(employee, appointments);
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6 md:py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <DialogHeader eyebrow="Perfil do barbeiro" title={employee.name} onClose={onClose} />

        <div className="mt-6 grid gap-6 md:grid-cols-[180px_1fr]">
          <div className="text-center">
            {employee.image ? (
              <img
                src={employee.image}
                alt={employee.name}
                className="h-32 w-32 rounded-full object-cover mx-auto ring-2 ring-[color:var(--gold)]/50"
              />
            ) : (
              <div className="mx-auto grid h-32 w-32 place-items-center rounded-full bg-accent font-display text-4xl text-gold ring-2 ring-gold/40">
                {employee.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="mt-4 text-xs uppercase tracking-[0.2em] text-gold">
              {employee.title}
            </div>
            <div className="mt-2 flex items-center justify-center gap-1 text-gold">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium">{employee.rating}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Faturamento" value={formatCurrency(performance.revenue)} />
              <Metric label="Atendimentos" value={String(performance.appointments)} />
              <Metric label="Comissão" value={formatCurrency(performance.commission)} />
            </div>

            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <div className="font-display text-lg">Contato</div>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gold" />
                  {employee.email || "E-mail não informado"}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gold" />
                  {employee.phone || "Telefone não informado"}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <div className="font-display text-lg">Resumo</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {employee.bio || "O profissional ainda não adicionou uma apresentação."}
              </p>
            </div>

            <div className="rounded-2xl border border-[color:var(--gold)]/25 bg-[color:var(--gold)]/5 p-4">
              <div className="flex items-center gap-2 font-display text-lg">
                <ShieldCheck className="h-4 w-4 text-gold" /> Acesso
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                {employee.accessStatus === "active" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-gold" /> Login de barbeiro ativo.
                  </>
                ) : (
                  <>
                    <KeyRound className="h-4 w-4 text-gold" /> Acesso ainda não criado no Supabase.
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPerformance(employee: Employee, appointments: AppointmentRecord[]) {
  const completed = appointments.filter(
    (appointment) =>
      (appointment.barber_id === employee.id || appointment.barber === employee.name) &&
      isCompletedStatus(appointment.status),
  );
  const revenue = completed.reduce((sum, appointment) => sum + appointment.price, 0);
  const rate = employee.commissionRate ?? 30;
  return { appointments: completed.length, revenue, commission: revenue * (rate / 100) };
}

function DialogHeader({
  eyebrow,
  title,
  onClose,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-[11px] uppercase tracking-[0.2em] text-gold">{eyebrow}</div>
        <h2 className="font-display mt-1 text-2xl">{title}</h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  min,
  max,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: string;
  max?: string;
  step?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        required={required}
        type={type}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-accent/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium text-gold">{value}</div>
    </div>
  );
}
