import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader, StatCard } from "@/components/layout/app-shell";
import {
  AlertTriangle,
  Check,
  Clock,
  Loader2,
  Pencil,
  Phone,
  Plus,
  Trash2,
  Users,
  Wallet,
  X,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import {
  deleteMonthlyMembership,
  getReferenceMonth,
  listMonthlyMembershipPayments,
  listMonthlyMemberships,
  markMonthlyMembershipPaid,
  type MonthlyMembershipPayment,
  type MonthlyMembershipRecord,
  saveMonthlyMembership,
  unmarkMonthlyMembershipPaid,
} from "@/data/repositories/monthly-membership-repository";
import { notifyError, notifySuccess } from "@/shared/notifications/toast";
import { formatCurrency } from "@/shared/utils/format";

export const Route = createFileRoute("/owner/monthly")({
  head: () => ({ meta: [{ title: "Mensalistas - King's Barber" }] }),
  component: MonthlyMembershipsPage,
});

function MonthlyMembershipsPage() {
  const [memberships, setMemberships] = useState<MonthlyMembershipRecord[]>([]);
  const [payments, setPayments] = useState<MonthlyMembershipPayment[]>([]);
  const [editing, setEditing] = useState<MonthlyMembershipRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const referenceMonth = getReferenceMonth();

  useEffect(() => {
    let active = true;

    void Promise.all([listMonthlyMemberships(), listMonthlyMembershipPayments(referenceMonth)])
      .then(([membershipRows, paymentRows]) => {
        if (!active) return;
        setMemberships(membershipRows);
        setPayments(paymentRows);
      })
      .catch((error) => active && notifyError(error))
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [referenceMonth]);

  const metrics = useMemo(() => {
    const activeMemberships = memberships.filter((item) => item.active);
    const activeIds = new Set(activeMemberships.map((item) => item.id));
    const paid = payments.filter((payment) => activeIds.has(payment.membershipId));
    const paidIds = new Set(paid.map((payment) => payment.membershipId));
    return {
      active: activeMemberships.length,
      expected: activeMemberships.reduce((sum, item) => sum + item.monthlyAmount, 0),
      received: paid.reduce((sum, item) => sum + item.amount, 0),
      pending: activeMemberships.filter((item) => !paidIds.has(item.id)).length,
    };
  }, [memberships, payments]);

  async function handleSave(membership: MonthlyMembershipRecord) {
    setBusyId(membership.id);
    try {
      const saved = await saveMonthlyMembership(membership);
      setMemberships((items) => {
        const exists = items.some((item) => item.id === saved.id);
        return exists
          ? items.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...items];
      });
      setCreating(false);
      setEditing(null);
      notifySuccess(editing ? "Mensalista atualizado." : "Mensalista cadastrado.");
    } catch (error) {
      notifyError(error);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(membership: MonthlyMembershipRecord) {
    if (!window.confirm(`Excluir ${membership.customerName} da lista de mensalistas?`)) return;
    setBusyId(membership.id);
    try {
      await deleteMonthlyMembership(membership.id);
      setMemberships((items) => items.filter((item) => item.id !== membership.id));
      setPayments((items) => items.filter((item) => item.membershipId !== membership.id));
      notifySuccess("Mensalista excluído.");
    } catch (error) {
      notifyError(error);
    } finally {
      setBusyId(null);
    }
  }

  async function togglePayment(membership: MonthlyMembershipRecord) {
    const payment = payments.find((item) => item.membershipId === membership.id);
    setBusyId(membership.id);
    try {
      if (payment) {
        await unmarkMonthlyMembershipPaid(membership.id, referenceMonth);
        setPayments((items) => items.filter((item) => item.id !== payment.id));
        notifySuccess("Pagamento mensal desfeito.");
      } else {
        const saved = await markMonthlyMembershipPaid(membership, referenceMonth);
        setPayments((items) => [
          saved,
          ...items.filter((item) => item.membershipId !== saved.membershipId),
        ]);
        notifySuccess("Pagamento mensal registrado.");
      }
    } catch (error) {
      notifyError(error);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AppShell role="owner">
      <PageHeader
        eyebrow="Pacotes recorrentes"
        title="Mensalistas"
        subtitle="Acompanhe quem fechou pacote mensal, os vencimentos e os pagamentos do mês."
        action={
          <Button onClick={() => setCreating(true)}>
            <Plus /> Novo mensalista
          </Button>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mensalistas ativos" value={String(metrics.active)} icon={Users} />
        <StatCard label="Previsto no mês" value={formatCurrency(metrics.expected)} icon={Wallet} />
        <StatCard label="Recebido no mês" value={formatCurrency(metrics.received)} icon={Check} />
        <StatCard label="Pagamentos pendentes" value={String(metrics.pending)} icon={Clock} />
      </section>

      <section className="mt-7 overflow-hidden rounded-2xl border border-border bg-card/65">
        <div className="flex flex-col gap-1 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl">Pacotes mensais</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Competência {formatReferenceMonth(referenceMonth)}
            </p>
          </div>
          <div className="mt-3 text-xs text-muted-foreground sm:mt-0">
            O pagamento é controlado separadamente a cada mês.
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-72 place-items-center text-sm text-muted-foreground">
            <Loader2 className="animate-spin text-gold" />
          </div>
        ) : memberships.length ? (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[940px] text-sm">
                <thead className="border-b border-border bg-muted/30 text-left text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
                  <tr>
                    <th className="px-5 py-4">Cliente</th>
                    <th className="px-5 py-4">Pacote</th>
                    <th className="px-5 py-4">Valor mensal</th>
                    <th className="px-5 py-4">Vencimento</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {memberships.map((membership) => (
                    <MonthlyRow
                      key={membership.id}
                      membership={membership}
                      paid={payments.some((item) => item.membershipId === membership.id)}
                      busy={busyId === membership.id}
                      onTogglePayment={() => void togglePayment(membership)}
                      onEdit={() => setEditing(membership)}
                      onDelete={() => void handleDelete(membership)}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="divide-y divide-border lg:hidden">
              {memberships.map((membership) => (
                <MonthlyCard
                  key={membership.id}
                  membership={membership}
                  paid={payments.some((item) => item.membershipId === membership.id)}
                  busy={busyId === membership.id}
                  onTogglePayment={() => void togglePayment(membership)}
                  onEdit={() => setEditing(membership)}
                  onDelete={() => void handleDelete(membership)}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="grid min-h-72 place-items-center px-6 py-12 text-center">
            <div>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 text-gold">
                <Wallet />
              </span>
              <h3 className="mt-4 font-display text-2xl">Nenhum mensalista cadastrado</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Cadastre o primeiro cliente que fechou um pacote mensal.
              </p>
              <Button className="mt-5" onClick={() => setCreating(true)}>
                <Plus /> Cadastrar mensalista
              </Button>
            </div>
          </div>
        )}
      </section>

      {(creating || editing) && (
        <MonthlyMembershipDialog
          membership={editing}
          saving={Boolean(busyId)}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSave={(membership) => void handleSave(membership)}
        />
      )}
    </AppShell>
  );
}

function MonthlyRow({
  membership,
  paid,
  busy,
  onTogglePayment,
  onEdit,
  onDelete,
}: MonthlyItemProps) {
  const status = getMembershipStatus(membership, paid);
  return (
    <tr className="border-b border-border/60 transition last:border-0 hover:bg-accent/25">
      <td className="px-5 py-5">
        <div className="font-medium">{membership.customerName}</div>
        <a
          href={whatsappUrl(membership.whatsapp)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-gold"
        >
          <Phone size={12} /> {membership.whatsapp}
        </a>
      </td>
      <td className="px-5 py-5">
        <div>{membership.planName}</div>
        {membership.notes ? (
          <div className="mt-1 max-w-56 truncate text-xs text-muted-foreground">
            {membership.notes}
          </div>
        ) : null}
      </td>
      <td className="px-5 py-5 font-display text-lg text-gold">
        {formatCurrency(membership.monthlyAmount)}
      </td>
      <td className="px-5 py-5 text-muted-foreground">Dia {membership.dueDay}</td>
      <td className="px-5 py-5">
        <StatusBadge status={status} />
      </td>
      <td className="px-5 py-5">
        <div className="flex justify-end gap-2">
          {membership.active ? (
            <Button
              size="sm"
              variant={paid ? "outline" : "default"}
              disabled={busy}
              onClick={onTogglePayment}
            >
              {busy ? <Loader2 className="animate-spin" /> : <Check />}
              {paid ? "Desfazer pagamento" : "Marcar como pago"}
            </Button>
          ) : null}
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Editar ${membership.customerName}`}
            onClick={onEdit}
          >
            <Pencil />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label={`Excluir ${membership.customerName}`}
            disabled={busy}
            onClick={onDelete}
          >
            <Trash2 />
          </Button>
        </div>
      </td>
    </tr>
  );
}

function MonthlyCard(props: MonthlyItemProps) {
  const { membership, paid, busy, onTogglePayment, onEdit, onDelete } = props;
  const status = getMembershipStatus(membership, paid);
  return (
    <article className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-xl">{membership.customerName}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{membership.planName}</p>
        </div>
        <StatusBadge status={status} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted/25 p-4 text-sm">
        <div>
          <div className="text-xs text-muted-foreground">Valor mensal</div>
          <div className="mt-1 font-display text-lg text-gold">
            {formatCurrency(membership.monthlyAmount)}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground">Vencimento</div>
          <div className="mt-1">Dia {membership.dueDay}</div>
        </div>
      </div>
      <a
        href={whatsappUrl(membership.whatsapp)}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-gold"
      >
        <Phone size={13} /> {membership.whatsapp}
      </a>
      <div className="mt-5 flex flex-wrap gap-2">
        {membership.active ? (
          <Button
            className="min-w-0 flex-1"
            size="sm"
            variant={paid ? "outline" : "default"}
            disabled={busy}
            onClick={onTogglePayment}
          >
            {busy ? <Loader2 className="animate-spin" /> : <Check />}
            {paid ? "Desfazer pagamento" : "Marcar como pago"}
          </Button>
        ) : null}
        <Button
          size="icon"
          variant="outline"
          aria-label={`Editar ${membership.customerName}`}
          onClick={onEdit}
        >
          <Pencil />
        </Button>
        <Button
          size="icon"
          variant="outline"
          aria-label={`Excluir ${membership.customerName}`}
          disabled={busy}
          onClick={onDelete}
        >
          <Trash2 />
        </Button>
      </div>
    </article>
  );
}

type MonthlyItemProps = {
  membership: MonthlyMembershipRecord;
  paid: boolean;
  busy: boolean;
  onTogglePayment: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

type MembershipStatus = "paid" | "pending" | "overdue" | "inactive";

function StatusBadge({ status }: { status: MembershipStatus }) {
  const styles: Record<MembershipStatus, string> = {
    paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    pending: "border-[color:var(--gold)]/30 bg-[color:var(--gold)]/10 text-gold",
    overdue: "border-destructive/30 bg-destructive/10 text-destructive",
    inactive: "border-border bg-muted/50 text-muted-foreground",
  };
  const labels: Record<MembershipStatus, string> = {
    paid: "Pago",
    pending: "Pendente",
    overdue: "Atrasado",
    inactive: "Pausado",
  };
  const Icon = status === "paid" ? Check : status === "overdue" ? AlertTriangle : Clock;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}
    >
      <Icon size={12} /> {labels[status]}
    </span>
  );
}

function MonthlyMembershipDialog({
  membership,
  saving,
  onClose,
  onSave,
}: {
  membership: MonthlyMembershipRecord | null;
  saving: boolean;
  onClose: () => void;
  onSave: (membership: MonthlyMembershipRecord) => void;
}) {
  const [customerName, setCustomerName] = useState(membership?.customerName ?? "");
  const [whatsapp, setWhatsapp] = useState(membership?.whatsapp ?? "");
  const [planName, setPlanName] = useState(membership?.planName ?? "Pacote mensal");
  const [monthlyAmount, setMonthlyAmount] = useState(String(membership?.monthlyAmount ?? ""));
  const [dueDay, setDueDay] = useState(String(membership?.dueDay ?? 10));
  const [notes, setNotes] = useState(membership?.notes ?? "");
  const [active, setActive] = useState(membership?.active ?? true);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave({
      id: membership?.id ?? crypto.randomUUID(),
      customerName: customerName.trim(),
      whatsapp: whatsapp.trim(),
      planName: planName.trim(),
      monthlyAmount: Number(monthlyAmount),
      dueDay: Number(dueDay),
      active,
      notes: notes.trim(),
      createdAt: membership?.createdAt,
      updatedAt: membership?.updatedAt,
    });
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/75 px-4 py-6 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-2xl border border-border bg-card p-5 shadow-2xl sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold">
              Pacote mensal
            </div>
            <h2 className="mt-1 font-display text-3xl">
              {membership ? "Editar mensalista" : "Novo mensalista"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-10 w-10 place-items-center rounded-full border border-border text-muted-foreground transition hover:text-foreground"
          >
            <X />
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Nome do cliente" className="sm:col-span-2">
            <input
              required
              minLength={2}
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="kb-field mt-1.5 h-12 px-4"
            />
          </Field>
          <Field label="WhatsApp">
            <input
              required
              type="tel"
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              placeholder="(11) 99999-9999"
              className="kb-field mt-1.5 h-12 px-4"
            />
          </Field>
          <Field label="Nome do pacote">
            <input
              required
              value={planName}
              onChange={(event) => setPlanName(event.target.value)}
              placeholder="Ex.: 4 cortes por mês"
              className="kb-field mt-1.5 h-12 px-4"
            />
          </Field>
          <Field label="Valor mensal (R$)">
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={monthlyAmount}
              onChange={(event) => setMonthlyAmount(event.target.value)}
              className="kb-field mt-1.5 h-12 px-4"
            />
          </Field>
          <Field label="Dia do vencimento">
            <input
              required
              type="number"
              min="1"
              max="28"
              step="1"
              value={dueDay}
              onChange={(event) => setDueDay(event.target.value)}
              className="kb-field mt-1.5 h-12 px-4"
            />
          </Field>
          <Field label="Observações" className="sm:col-span-2">
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Detalhes do pacote ou preferências do cliente"
              className="kb-field mt-1.5 resize-none px-4 py-3"
            />
          </Field>
        </div>

        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
            className="h-4 w-4 accent-[color:var(--gold)]"
          />
          <span>
            <strong className="block font-medium">Pacote ativo</strong>
            <span className="text-xs text-muted-foreground">
              Desmarque para pausar sem apagar o histórico.
            </span>
          </span>
        </label>

        <div className="mt-6 flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : <Check />}
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function getMembershipStatus(membership: MonthlyMembershipRecord, paid: boolean): MembershipStatus {
  if (!membership.active) return "inactive";
  if (paid) return "paid";
  return new Date().getDate() > membership.dueDay ? "overdue" : "pending";
}

function formatReferenceMonth(referenceMonth: string) {
  const [year, month] = referenceMonth.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function whatsappUrl(value: string) {
  const digits = value.replace(/\D/g, "");
  return `https://wa.me/${digits.startsWith("55") ? digits : `55${digits}`}`;
}
