import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { fmtBRL } from "@/lib/sample-data";
import { deleteEmployee, EmployeeRecord, listEmployees, saveEmployee } from "@/lib/business-data";
import { supabase } from "@/lib/supabase";
import { CheckCircle2, KeyRound, Mail, Phone, Plus, ShieldCheck, Star, Trash2, X } from "lucide-react";

type Employee = EmployeeRecord;
const defaultImage = "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&q=80";

export const Route = createFileRoute("/owner/employees")({
  head: () => ({ meta: [{ title: "Equipe - Maison Lame" }] }),
  component: EmployeesPage,
});

function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [addingEmployee, setAddingEmployee] = useState(false);
  const [profileEmployee, setProfileEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    listEmployees().then(setEmployees);
  }, []);

  async function handleCreate(employee: Employee) {
    const saved = await saveEmployee(employee);
    setEmployees([...employees, saved]);
    setAddingEmployee(false);
  }

  async function handleDelete(employee: Employee) {
    await deleteEmployee(employee.id);
    setEmployees(employees.filter((item) => item.id !== employee.id));
    if (profileEmployee?.id === employee.id) {
      setProfileEmployee(null);
    }
  }

  return (
    <AppShell role="owner">
      <PageHeader
        eyebrow="Talentos"
        title="Equipe"
        subtitle="As maos por tras de cada corte. Gerencie perfis, agendas e comissoes."
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
        {employees.map((barber) => (
          <div key={barber.id} className="glass-card rounded-2xl p-6 text-center group hover:gold-glow transition">
            <div className="relative inline-block">
              <img
                src={barber.image}
                alt={barber.name}
                className="h-24 w-24 rounded-full object-cover mx-auto ring-2 ring-[color:var(--gold)]/40 group-hover:ring-[color:var(--gold)] transition"
              />
              <div className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full bg-card border border-[color:var(--gold)]/40">
                <Star className="h-3.5 w-3.5 text-gold fill-current" />
              </div>
            </div>
            <div className="mt-4 font-display text-lg">{barber.name}</div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">{barber.title}</div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-left">
              <div className="rounded-xl bg-accent/40 p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Faturamento</div>
                <div className="text-gold text-sm font-medium mt-1">{fmtBRL(barber.revenue)}</div>
              </div>
              <div className="rounded-xl bg-accent/40 p-3">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Atend.</div>
                <div className="text-sm font-medium mt-1">{barber.appts}</div>
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
        ))}
      </div>

      {addingEmployee && (
        <AddEmployeeDialog
          onClose={() => setAddingEmployee(false)}
          onSave={handleCreate}
        />
      )}

      {profileEmployee && (
        <EmployeeProfileDialog
          employee={profileEmployee}
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
  const [rating, setRating] = useState("4.8");
  const [revenue, setRevenue] = useState("0");
  const [appts, setAppts] = useState("0");
  const [commission, setCommission] = useState("0");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

      if (password.length < 8) {
        setError("Use uma senha temporaria com pelo menos 8 caracteres.");
        return;
      }
    }

    setLoading(true);
    let accessUserId: string | undefined;
    let accessStatus: Employee["accessStatus"] = createAccess ? "pending" : "local";

    if (createAccess && supabase) {
      const { data, error: functionError } = await supabase.functions.invoke("create-barber", {
        body: {
          name: name.trim(),
          email: email.trim(),
          password,
          title: title.trim(),
          image: image.trim() || defaultImage,
        },
      });

      if (functionError) {
        accessStatus = "pending";
        setAccessMessage(
          "Barbeiro salvo no painel. O login ficou pendente porque a funcao create-barber ainda nao foi publicada no Supabase.",
        );
      } else {
        accessUserId = data?.user?.id;
        accessStatus = "active";
        setAccessMessage("Acesso do barbeiro criado com seguranca.");
      }
    }

    if (createAccess && !supabase) {
      setAccessMessage("Barbeiro salvo no painel. Configure o Supabase para criar o login real.");
    }

    onSave({
      id: `b-${Date.now()}`,
      name: name.trim(),
      title: title.trim(),
      image: image.trim() || defaultImage,
      rating: Number(rating),
      revenue: Number(revenue),
      appts: Number(appts),
      commission: Number(commission),
      email: email.trim() || undefined,
      accessStatus,
      accessUserId,
    });

    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6 md:py-10">
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <DialogHeader eyebrow="Adicionar barbeiro" title="Novo talento" onClose={onClose} />

        <div className="mt-6 space-y-4">
          <TextField label="Nome" value={name} onChange={setName} required />
          <TextField label="Cargo" value={title} onChange={setTitle} required />
          <TextField label="URL da foto" value={image} onChange={setImage} />

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Nota" value={rating} onChange={setRating} type="number" min="0" max="5" step="0.1" required />
            <TextField label="Atendimentos" value={appts} onChange={setAppts} type="number" min="0" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TextField label="Faturamento" value={revenue} onChange={setRevenue} type="number" min="0" required />
            <TextField label="Comissao" value={commission} onChange={setCommission} type="number" min="0" required />
          </div>

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
                  O login sera criado com a role barber e entrara direto no ambiente de barbeiro.
                </span>
              </span>
            </label>

            {createAccess && (
              <div className="mt-4 space-y-3">
                <TextField label="E-mail de acesso" value={email} onChange={setEmail} type="email" required />
                <TextField label="Senha temporaria" value={password} onChange={setPassword} type="password" min="8" required />
              </div>
            )}
          </div>

          {error && <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">{error}</div>}
          {accessMessage && <div className="rounded-xl border border-[color:var(--gold)]/40 bg-accent/40 p-3 text-xs text-muted-foreground">{accessMessage}</div>}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition"
          >
            Cancelar
          </button>
          <button type="submit" disabled={loading} className="flex-1 rounded-xl gradient-gold px-4 py-3 text-sm font-medium text-primary-foreground gold-glow disabled:cursor-not-allowed disabled:opacity-70">
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function EmployeeProfileDialog({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 px-4 py-6 md:py-10">
      <div className="mx-auto w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <DialogHeader eyebrow="Perfil do barbeiro" title={employee.name} onClose={onClose} />

        <div className="mt-6 grid gap-6 md:grid-cols-[180px_1fr]">
          <div className="text-center">
            <img
              src={employee.image}
              alt={employee.name}
              className="h-32 w-32 rounded-full object-cover mx-auto ring-2 ring-[color:var(--gold)]/50"
            />
            <div className="mt-4 text-xs uppercase tracking-[0.2em] text-gold">{employee.title}</div>
            <div className="mt-2 flex items-center justify-center gap-1 text-gold">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-medium">{employee.rating}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Metric label="Faturamento" value={fmtBRL(employee.revenue)} />
              <Metric label="Atendimentos" value={String(employee.appts)} />
              <Metric label="Comissao" value={fmtBRL(employee.commission)} />
            </div>

            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <div className="font-display text-lg">Contato</div>
              <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gold" />
                  {employee.email || `${employee.name.toLowerCase().replaceAll(" ", ".")}@kingsbarber.com.br`}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gold" />
                  +55 11 90000-0000
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-background/40 p-4">
              <div className="font-display text-lg">Resumo</div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Profissional ativo na equipe King's Barber, com desempenho acompanhado pelo painel do proprietario.
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
                    <KeyRound className="h-4 w-4 text-gold" /> Acesso ainda nao criado no Supabase.
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

function DialogHeader({ eyebrow, title, onClose }: { eyebrow: string; title: string; onClose: () => void }) {
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
