import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import {
  Crown,
  Edit3,
  Gift,
  History,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserRound,
  Users,
  Wallet,
  X,
  Phone,
  Mail,
  type LucideIcon,
} from "lucide-react";
import {
  Customer,
  CustomerInput,
  CustomerStatus,
  createCustomer,
  deleteCustomer,
  listCustomerHistory,
  listCustomers,
  updateCustomer,
  CustomerHistory,
} from "@/data/repositories/customer-repository";
import { notifyError, notifySuccess } from "@/shared/notifications/toast";

const pageSize = 6;
type FilterKey = "all" | "vip" | "birthday" | "30" | "60" | "90" | "top" | "new";
type SortKey = "name" | "total_spent" | "last_visit" | "visits";

export const Route = createFileRoute("/owner/customers")({
  head: () => ({ meta: [{ title: "Clientes - King's Barber" }] }),
  component: CustomersPage,
});

function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [history, setHistory] = useState<CustomerHistory[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterKey>("all");
  const [sort, setSort] = useState<SortKey>("total_spent");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      try {
        const [customerRows, historyRows] = await Promise.all([
          listCustomers(),
          listCustomerHistory(),
        ]);
        if (!active) return;
        setCustomers(customerRows);
        setHistory(historyRows);
        setSelectedCustomer(customerRows[0] || null);
      } catch (error) {
        if (active) notifyError(error);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const now = new Date();

    return customers
      .filter((customer) => {
        const lastVisitDays = customer.last_visit
          ? Math.floor((now.getTime() - new Date(customer.last_visit).getTime()) / 86400000)
          : 999;
        const birthdayMonth = customer.birth_date
          ? new Date(customer.birth_date).getMonth() === now.getMonth()
          : false;
        const createdDate = new Date(customer.created_at);
        const createdThisMonth =
          createdDate.getMonth() === now.getMonth() &&
          createdDate.getFullYear() === now.getFullYear();
        const queryMatch = [
          customer.name,
          customer.whatsapp,
          customer.email,
          customer.favorite_barber,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

        if (!queryMatch) return false;
        if (filter === "vip") return customer.status === "vip";
        if (filter === "birthday") return birthdayMonth;
        if (filter === "30") return lastVisitDays >= 30;
        if (filter === "60") return lastVisitDays >= 60;
        if (filter === "90") return lastVisitDays >= 90;
        if (filter === "top") return customer.total_spent >= 250;
        if (filter === "new") return createdThisMonth;
        return true;
      })
      .sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "last_visit")
          return String(b.last_visit || "").localeCompare(String(a.last_visit || ""));
        if (sort === "visits") return b.visits - a.visits;
        return b.total_spent - a.total_spent;
      });
  }, [customers, filter, query, sort]);

  const pagedCustomers = filteredCustomers.slice((page - 1) * pageSize, page * pageSize);
  const pageCount = Math.max(1, Math.ceil(filteredCustomers.length / pageSize));
  const selectedHistory = history.filter((item) => item.customer_id === selectedCustomer?.id);
  const metrics = useMemo(() => buildMetrics(customers), [customers]);

  async function handleCreate(input: CustomerInput) {
    setSaving(true);
    try {
      const created = await createCustomer(input);
      setCustomers((items) => [created, ...items]);
      setSelectedCustomer(created);
      setCreatingCustomer(false);
      notifySuccess("Cliente criado.");
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(customer: Customer) {
    setSaving(true);
    try {
      const updated = await updateCustomer(customer);
      setCustomers((items) => items.map((item) => (item.id === updated.id ? updated : item)));
      setSelectedCustomer(updated);
      setEditingCustomer(null);
      notifySuccess("Cliente atualizado.");
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(customer: Customer) {
    setSaving(true);
    try {
      await deleteCustomer(customer.id);
      setCustomers((items) => items.filter((item) => item.id !== customer.id));
      setSelectedCustomer(null);
      notifySuccess("Cliente excluído.");
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell role="owner">
      <PageHeader
        eyebrow="Relacionamento"
        title="Clientes"
        subtitle="Gerencie clientes, preferencias, recorrencia e oportunidades de retorno."
        action={
          <button
            type="button"
            onClick={() => setCreatingCustomer(true)}
            className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2.5 text-sm font-medium text-primary-foreground gold-glow"
          >
            <Plus className="h-4 w-4" /> Novo Cliente
          </button>
        }
      />

      <section className="grid grid-cols-2 xl:grid-cols-6 gap-4">
        <CustomerMetricCard
          title="Total de clientes"
          value={String(metrics.total)}
          delta="+12%"
          desc="vs. mês anterior"
          icon={Users}
        />
        <CustomerMetricCard
          title="Novos no mês"
          value={String(metrics.newThisMonth)}
          delta="+19%"
          desc="cadastros recentes"
          icon={UserRound}
        />
        <CustomerMetricCard
          title="Recorrentes"
          value={String(metrics.recurring)}
          delta={`${metrics.recurringPercent}%`}
          desc="do total"
          icon={Sparkles}
        />
        <CustomerMetricCard
          title="Ticket medio"
          value={fmtCurrency(metrics.averageTicket)}
          delta="+8%"
          desc="por visita"
          icon={Wallet}
        />
        <CustomerMetricCard
          title="Clientes VIP"
          value={String(metrics.vip)}
          delta={`${metrics.vipPercent}%`}
          desc="do total"
          icon={Crown}
        />
        <CustomerMetricCard
          title="Inativos"
          value={String(metrics.inactive)}
          delta="-4%"
          desc="sem retorno"
          icon={History}
        />
      </section>

      <section className="mt-6 glass-card rounded-2xl p-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar cliente..."
              className="w-full rounded-xl border border-border bg-background/70 py-2.5 pl-9 pr-4 text-sm outline-none transition focus:border-[color:var(--gold)]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortKey)}
              className="rounded-xl border border-border bg-background/70 px-3 py-2.5 text-xs text-muted-foreground outline-none focus:border-[color:var(--gold)]"
            >
              <option value="total_spent">Maior gasto</option>
              <option value="last_visit">Última visita</option>
              <option value="visits">Mais visitas</option>
              <option value="name">Nome</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {quickFilters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => {
                setFilter(item.key);
                setPage(1);
              }}
              className={`shrink-0 rounded-xl border px-3 py-2 text-xs transition ${
                filter === item.key
                  ? "border-[color:var(--gold)] text-gold bg-[color:var(--gold)]/10"
                  : "border-border text-muted-foreground hover:border-[color:var(--gold)]/50 hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="glass-card rounded-2xl overflow-hidden">
          <CustomersTable
            loading={loading}
            customers={pagedCustomers}
            selectedId={selectedCustomer?.id}
            onSelect={setSelectedCustomer}
            onEdit={setEditingCustomer}
            onDelete={handleDelete}
          />
          <div className="flex flex-col gap-3 border-t border-border px-4 py-4 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
            <div>
              Mostrando {pagedCustomers.length ? (page - 1) * pageSize + 1 : 0} a{" "}
              {Math.min(page * pageSize, filteredCustomers.length)} de {filteredCustomers.length}{" "}
              clientes
            </div>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(pageCount, 5) }, (_, index) => index + 1).map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => setPage(item)}
                    className={`grid h-8 w-8 place-items-center rounded-lg border ${
                      page === item
                        ? "border-[color:var(--gold)] text-gold"
                        : "border-border hover:text-foreground"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </div>
        </div>

        <CustomerDrawer
          customer={selectedCustomer}
          history={selectedHistory}
          onClose={() => setSelectedCustomer(null)}
          onEdit={(customer) => setEditingCustomer(customer)}
          onNotesSave={handleUpdate}
        />
      </section>

      <RetentionPanels customers={customers} />

      {creatingCustomer && (
        <CustomerFormDialog
          title="Novo Cliente"
          saving={saving}
          onClose={() => setCreatingCustomer(false)}
          onSave={handleCreate}
        />
      )}

      {editingCustomer && (
        <CustomerFormDialog
          title="Editar Cliente"
          customer={editingCustomer}
          saving={saving}
          onClose={() => setEditingCustomer(null)}
          onSave={(input) => handleUpdate({ ...editingCustomer, ...input })}
        />
      )}
    </AppShell>
  );
}

const quickFilters: Array<{ key: FilterKey; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "vip", label: "VIPs" },
  { key: "birthday", label: "Aniversariantes" },
  { key: "30", label: "Sem visitar 30 dias" },
  { key: "60", label: "Sem visitar 60 dias" },
  { key: "90", label: "Sem visitar 90 dias" },
  { key: "top", label: "Mais gastam" },
  { key: "new", label: "Clientes novos" },
];

function CustomerMetricCard({
  title,
  value,
  delta,
  desc,
  icon: Icon,
}: {
  title: string;
  value: string;
  delta: string;
  desc: string;
  icon: LucideIcon;
}) {
  return (
    <div className="glass-card rounded-2xl p-5 transition hover:-translate-y-0.5 hover:gold-glow">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-muted-foreground">{title}</div>
          <div className="mt-3 font-display text-2xl">{value}</div>
          <div className="mt-3 text-xs">
            <span className="text-gold">{delta}</span>
            <span className="ml-1 text-muted-foreground">{desc}</span>
          </div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--gold)]/10 text-gold ring-1 ring-[color:var(--gold)]/20">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function CustomersTable({
  loading,
  customers,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
}: {
  loading: boolean;
  customers: Customer[];
  selectedId?: string;
  onSelect: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}) {
  if (loading) {
    return (
      <div className="p-4">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="mb-3 h-16 animate-pulse rounded-xl bg-accent/40" />
        ))}
      </div>
    );
  }

  if (!customers.length) {
    return (
      <div className="grid min-h-[360px] place-items-center p-8 text-center">
        <div>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-[color:var(--gold)]/30 text-gold">
            <Users className="h-5 w-5" />
          </div>
          <div className="mt-4 font-display text-xl">Nenhum cliente encontrado</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajuste a busca ou cadastre um novo cliente.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto scrollbar-none">
      <table className="min-w-[1080px] w-full text-sm">
        <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-4">Cliente</th>
            <th className="px-4 py-4">WhatsApp</th>
            <th className="px-4 py-4">Barbeiro favorito</th>
            <th className="px-4 py-4">Última visita</th>
            <th className="px-4 py-4">Proximo agendamento</th>
            <th className="px-4 py-4">Total gasto</th>
            <th className="px-4 py-4">Frequencia</th>
            <th className="px-4 py-4">Status</th>
            <th className="px-4 py-4 text-right">Acoes</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className={`border-b border-border/40 transition hover:bg-accent/30 ${selectedId === customer.id ? "bg-[color:var(--gold)]/10" : ""}`}
            >
              <td className="px-4 py-4">
                <button
                  type="button"
                  onClick={() => onSelect(customer)}
                  className="flex items-center gap-3 text-left"
                >
                  <Avatar customer={customer} />
                  <div>
                    <div className="flex items-center gap-2 font-medium">
                      {customer.name}
                      {customer.status === "vip" && (
                        <span className="rounded-full border border-[color:var(--gold)]/40 px-2 py-0.5 text-[10px] text-gold">
                          VIP
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {customer.city || "Sem cidade"}
                    </div>
                  </div>
                </button>
              </td>
              <td className="px-4 py-4 text-muted-foreground">{customer.whatsapp}</td>
              <td className="px-4 py-4">{customer.favorite_barber || "-"}</td>
              <td className="px-4 py-4">{formatDate(customer.last_visit)}</td>
              <td className="px-4 py-4">{formatDateTime(customer.next_appointment)}</td>
              <td className="px-4 py-4 text-gold">{fmtCurrency(customer.total_spent)}</td>
              <td className="px-4 py-4">{customer.frequency_days} dias</td>
              <td className="px-4 py-4">
                <StatusBadge status={customer.status} />
              </td>
              <td className="px-4 py-4">
                <div className="flex justify-end gap-2">
                  <IconButton
                    title="Visualizar perfil"
                    onClick={() => onSelect(customer)}
                    icon={MoreHorizontal}
                  />
                  <IconButton title="Editar" onClick={() => onEdit(customer)} icon={Edit3} />
                  <IconButton
                    title="Enviar WhatsApp"
                    onClick={() => openWhatsapp(customer)}
                    icon={MessageCircle}
                  />
                  <IconButton title="Histórico" onClick={() => onSelect(customer)} icon={History} />
                  <IconButton title="Excluir" onClick={() => onDelete(customer)} icon={Trash2} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CustomerDrawer({
  customer,
  history,
  onClose,
  onEdit,
  onNotesSave,
}: {
  customer: Customer | null;
  history: CustomerHistory[];
  onClose: () => void;
  onEdit: (customer: Customer) => void;
  onNotesSave: (customer: Customer) => void;
}) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setNotes(customer?.internal_notes || "");
  }, [customer]);

  if (!customer) {
    return (
      <aside className="hidden 2xl:grid glass-card rounded-2xl min-h-[520px] place-items-center p-6 text-center">
        <div>
          <UserRound className="mx-auto h-8 w-8 text-gold" />
          <p className="mt-3 text-sm text-muted-foreground">
            Selecione um cliente para abrir o perfil lateral.
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="glass-card rounded-2xl p-5 2xl:sticky 2xl:top-24 2xl:max-h-[calc(100vh-7rem)] 2xl:overflow-y-auto scrollbar-none">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar customer={customer} size="lg" />
          <div>
            <div className="flex items-center gap-2 font-display text-xl">
              {customer.name}
              {customer.status === "vip" && <Crown className="h-4 w-4 text-gold" />}
            </div>
            <div className="mt-1 text-xs text-gold">{customer.loyalty_points} pontos</div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-2">
        <DrawerAction
          label="WhatsApp"
          icon={MessageCircle}
          onClick={() => openWhatsapp(customer)}
        />
        <DrawerAction label="Ligar" icon={Phone} />
        <DrawerAction label="Editar" icon={Edit3} onClick={() => onEdit(customer)} />
        <DrawerAction label="Mais" icon={MoreHorizontal} />
      </div>

      <DrawerBlock title="Dados">
        <InfoRow icon={Mail} value={customer.email || "-"} />
        <InfoRow icon={Phone} value={customer.whatsapp} />
        <InfoRow
          icon={Gift}
          value={customer.birth_date ? `${formatDate(customer.birth_date)}` : "-"}
        />
      </DrawerBlock>

      <DrawerBlock title="Resumo">
        <div className="grid grid-cols-2 gap-3">
          <MiniMetric label="Total gasto" value={fmtCurrency(customer.total_spent)} />
          <MiniMetric label="Ticket medio" value={fmtCurrency(customer.average_ticket)} />
          <MiniMetric label="Visitas" value={String(customer.visits)} />
          <MiniMetric label="Frequencia" value={`${customer.frequency_days} dias`} />
          <MiniMetric label="Última visita" value={formatDate(customer.last_visit)} />
          <MiniMetric label="Proximo" value={formatDateTime(customer.next_appointment)} />
        </div>
      </DrawerBlock>

      <DrawerBlock title="Histórico">
        <div className="space-y-3">
          {history.slice(0, 5).map((item) => (
            <div key={item.id} className="rounded-xl border border-border bg-background/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">{item.service}</div>
                <div className="text-sm text-gold">{fmtCurrency(item.paid)}</div>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {formatDate(item.visited_at)} com {item.barber}
              </div>
            </div>
          ))}
        </div>
      </DrawerBlock>

      <DrawerBlock title="Preferencias">
        <p className="text-sm text-muted-foreground">
          Barbeiro favorito:{" "}
          <span className="text-foreground">{customer.favorite_barber || "-"}</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Corte favorito: <span className="text-foreground">{customer.favorite_cut || "-"}</span>
        </p>
        <p className="mt-3 rounded-xl border border-[color:var(--gold)]/20 bg-[color:var(--gold)]/5 p-3 text-sm text-muted-foreground">
          {customer.barber_notes || "Sem observacoes do barbeiro."}
        </p>
      </DrawerBlock>

      <DrawerBlock title="Fidelidade">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">8 cortes = barba gratis</span>
          <span className="text-gold">{Math.min(customer.visits, 8)} / 8</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-accent">
          <div
            className="h-full rounded-full gradient-gold"
            style={{ width: `${Math.min(100, (customer.visits / 8) * 100)}%` }}
          />
        </div>
      </DrawerBlock>

      <DrawerBlock title="Observacoes">
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          className="min-h-24 w-full rounded-xl border border-border bg-background/50 p-3 text-sm outline-none transition focus:border-[color:var(--gold)]"
        />
        <button
          onClick={() => onNotesSave({ ...customer, internal_notes: notes })}
          className="mt-3 w-full rounded-xl gradient-gold px-4 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Salvar observacao
        </button>
      </DrawerBlock>
    </aside>
  );
}

function CustomerFormDialog({
  title,
  customer,
  saving,
  onClose,
  onSave,
}: {
  title: string;
  customer?: Customer;
  saving: boolean;
  onClose: () => void;
  onSave: (input: CustomerInput) => void;
}) {
  const [form, setForm] = useState<CustomerInput>(() => ({
    name: customer?.name || "",
    whatsapp: customer?.whatsapp || "",
    email: customer?.email || "",
    instagram: customer?.instagram || "",
    birth_date: customer?.birth_date || "",
    city: customer?.city || "",
    avatar_url: customer?.avatar_url || "",
    favorite_barber: customer?.favorite_barber || "",
    favorite_cut: customer?.favorite_cut || "",
    barber_notes: customer?.barber_notes || "",
    internal_notes: customer?.internal_notes || "",
    last_visit: customer?.last_visit || "",
    next_appointment: customer?.next_appointment || "",
    total_spent: customer?.total_spent || 0,
    average_ticket: customer?.average_ticket || 0,
    visits: customer?.visits || 0,
    frequency_days: customer?.frequency_days || 30,
    status: customer?.status || "active",
    loyalty_points: customer?.loyalty_points || 0,
  }));

  function patch<K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      ...form,
      email: emptyToNull(form.email),
      instagram: emptyToNull(form.instagram),
      birth_date: emptyToNull(form.birth_date),
      city: emptyToNull(form.city),
      avatar_url: emptyToNull(form.avatar_url),
      favorite_barber: emptyToNull(form.favorite_barber),
      favorite_cut: emptyToNull(form.favorite_cut),
      barber_notes: emptyToNull(form.barber_notes),
      internal_notes: emptyToNull(form.internal_notes),
      last_visit: emptyToNull(form.last_visit),
      next_appointment: emptyToNull(form.next_appointment),
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
      <form
        onSubmit={submit}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl scrollbar-none"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-gold">{title}</div>
            <h2 className="font-display mt-1 text-2xl">Cadastro premium</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <TextField
            label="Nome"
            value={form.name}
            onChange={(value) => patch("name", value)}
            required
          />
          <TextField
            label="WhatsApp"
            value={form.whatsapp}
            onChange={(value) => patch("whatsapp", value)}
            required
          />
          <TextField
            label="E-mail"
            value={form.email || ""}
            onChange={(value) => patch("email", value)}
          />
          <TextField
            label="Instagram"
            value={form.instagram || ""}
            onChange={(value) => patch("instagram", value)}
          />
          <TextField
            label="Nascimento"
            type="date"
            value={form.birth_date || ""}
            onChange={(value) => patch("birth_date", value)}
          />
          <TextField
            label="Cidade"
            value={form.city || ""}
            onChange={(value) => patch("city", value)}
          />
          <TextField
            label="Foto/avatar URL"
            value={form.avatar_url || ""}
            onChange={(value) => patch("avatar_url", value)}
          />
          <TextField
            label="Barbeiro favorito"
            value={form.favorite_barber || ""}
            onChange={(value) => patch("favorite_barber", value)}
          />
          <TextField
            label="Corte favorito"
            value={form.favorite_cut || ""}
            onChange={(value) => patch("favorite_cut", value)}
          />
          <TextField
            label="Última visita"
            type="date"
            value={form.last_visit || ""}
            onChange={(value) => patch("last_visit", value)}
          />
          <TextField
            label="Proximo agendamento"
            type="datetime-local"
            value={toDatetimeLocal(form.next_appointment)}
            onChange={(value) => patch("next_appointment", value)}
          />
          <SelectField
            label="Status"
            value={form.status}
            onChange={(value) => patch("status", value as CustomerStatus)}
          />
          <NumberField
            label="Total gasto"
            value={form.total_spent}
            onChange={(value) => patch("total_spent", value)}
          />
          <NumberField
            label="Ticket medio"
            value={form.average_ticket}
            onChange={(value) => patch("average_ticket", value)}
          />
          <NumberField
            label="Visitas"
            value={form.visits}
            onChange={(value) => patch("visits", value)}
          />
          <NumberField
            label="Pontos"
            value={form.loyalty_points}
            onChange={(value) => patch("loyalty_points", value)}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TextArea
            label="Observacoes do barbeiro"
            value={form.barber_notes || ""}
            onChange={(value) => patch("barber_notes", value)}
          />
          <TextArea
            label="Observacoes internas"
            value={form.internal_notes || ""}
            onChange={(value) => patch("internal_notes", value)}
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-xl gradient-gold px-4 py-3 text-sm font-medium text-primary-foreground disabled:opacity-70"
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </form>
    </div>
  );
}

function RetentionPanels({ customers }: { customers: Customer[] }) {
  const missing = customers.filter((customer) => daysSince(customer.last_visit) >= 30);
  const birthdays = customers.filter(
    (customer) =>
      customer.birth_date &&
      new Date(`${customer.birth_date}T12:00:00`).getMonth() === new Date().getMonth(),
  );
  const top = [...customers].sort((a, b) => b.total_spent - a.total_spent).slice(0, 3);
  const vip = customers.filter((customer) => customer.status === "vip").slice(0, 4);

  return (
    <section className="mt-6 grid gap-4 xl:grid-cols-4">
      <RetentionCard
        title="Clientes sumidos"
        subtitle="Sem voltar ha 30 dias"
        count={`${missing.length} clientes`}
        customers={missing}
        action="Contatar primeiro cliente"
      />
      <RetentionCard
        title="Aniversariantes"
        subtitle="Clientes do mês"
        count={`${birthdays.length} clientes`}
        customers={birthdays}
        action="Contatar primeiro cliente"
      />
      <RankingCard title="Top clientes" customers={top} />
      <RetentionCard
        title="Clientes VIP"
        subtitle="Melhores clientes da casa"
        count={`${vip.length} VIPs`}
        customers={vip}
        action="Contatar primeiro cliente"
      />
    </section>
  );
}

function RetentionCard({
  title,
  subtitle,
  count,
  customers,
  action,
}: {
  title: string;
  subtitle: string;
  count: string;
  customers: Customer[];
  action: string;
}) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="font-display text-lg">{title}</div>
        <div className="text-xs text-gold">{count}</div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-5 flex -space-x-2">
        {customers.slice(0, 5).map((customer) => (
          <Avatar key={customer.id} customer={customer} />
        ))}
        {customers.length > 5 && (
          <div className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-xs text-muted-foreground">
            +{customers.length - 5}
          </div>
        )}
      </div>
      <button
        type="button"
        disabled={!customers.length}
        onClick={() => {
          const customer = customers[0];
          if (customer) openWhatsapp(customer);
        }}
        className="mt-5 w-full rounded-xl gradient-gold px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45"
      >
        {action}
      </button>
    </div>
  );
}

function RankingCard({ title, customers }: { title: string; customers: Customer[] }) {
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="font-display text-lg">{title}</div>
      <div className="mt-4 space-y-3">
        {customers.map((customer, index) => (
          <div key={customer.id} className="flex items-center gap-3">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-[color:var(--gold)]/10 text-xs text-gold">
              {index + 1}
            </span>
            <Avatar customer={customer} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{customer.name}</div>
              <div className="text-xs text-muted-foreground">{customer.visits} visitas</div>
            </div>
            <div className="text-sm text-gold">{fmtCurrency(customer.total_spent)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: CustomerStatus }) {
  const map = {
    active: ["Ativo", "bg-emerald-400"],
    missing: ["Sumido", "bg-yellow-400"],
    inactive: ["Inativo", "bg-red-500"],
    vip: ["VIP", "bg-[color:var(--gold)]"],
  } as const;
  const [label, dot] = map[status];
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-xs">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function Avatar({ customer, size = "sm" }: { customer: Customer; size?: "sm" | "lg" }) {
  const classes = size === "lg" ? "h-16 w-16" : "h-9 w-9";
  if (customer.avatar_url) {
    return (
      <img
        src={customer.avatar_url}
        alt={customer.name}
        className={`${classes} rounded-full object-cover ring-1 ring-[color:var(--gold)]/40`}
      />
    );
  }
  return (
    <div
      className={`${classes} grid place-items-center rounded-full gradient-gold text-sm font-semibold text-primary-foreground`}
    >
      {customer.name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function IconButton({
  title,
  icon: Icon,
  onClick,
}: {
  title: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      type="button"
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:border-[color:var(--gold)]/60 hover:text-gold transition"
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

function DrawerAction({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-border bg-background/40 p-3 text-center text-xs text-muted-foreground hover:border-[color:var(--gold)]/50 hover:text-gold transition"
    >
      <Icon className="mx-auto mb-2 h-4 w-4" />
      {label}
    </button>
  );
}

function DrawerBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-2xl border border-border bg-background/40 p-4">
      <div className="font-display text-lg">{title}</div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function InfoRow({ icon: Icon, value }: { icon: LucideIcon; value: string }) {
  return (
    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4 text-gold" />
      {value}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-accent/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 text-sm font-medium text-gold">{value}</div>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <TextField
      label={label}
      type="number"
      value={String(value)}
      onChange={(value) => onChange(Number(value))}
    />
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 min-h-24 w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: CustomerStatus;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
      >
        <option value="active">Ativo</option>
        <option value="missing">Sumido</option>
        <option value="inactive">Inativo</option>
        <option value="vip">VIP</option>
      </select>
    </label>
  );
}

function buildMetrics(customers: Customer[]) {
  const total = customers.length;
  const vip = customers.filter((customer) => customer.status === "vip").length;
  const inactive = customers.filter((customer) => customer.status === "inactive").length;
  const recurring = customers.filter((customer) => customer.visits >= 3).length;
  const now = new Date();
  const newThisMonth = customers.filter((customer) => {
    const createdAt = new Date(customer.created_at);
    return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
  }).length;
  const spent = customers.reduce((sum, customer) => sum + customer.total_spent, 0);
  const visits = customers.reduce((sum, customer) => sum + customer.visits, 0);
  return {
    total,
    vip,
    inactive,
    recurring,
    newThisMonth,
    averageTicket: visits ? spent / visits : 0,
    recurringPercent: total ? Math.round((recurring / total) * 100) : 0,
    vipPercent: total ? Math.round((vip / total) * 100) : 0,
  };
}

function daysSince(date: string | null) {
  if (!date) return 999;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function formatDate(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("pt-BR");
}

function formatDateTime(date: string | null) {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fmtCurrency(value: number) {
  return (
    "R$ " + value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  );
}

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  return value.slice(0, 16);
}

function emptyToNull(value: string | null) {
  return value && value.trim() ? value : null;
}

function openWhatsapp(customer: Customer) {
  const phone = customer.whatsapp.replace(/\D/g, "");
  window.open(`https://wa.me/55${phone}`, "_blank", "noopener,noreferrer");
}
