import { supabase } from "@/integrations/supabase/client";
import { throwRepositoryError } from "@/data/repositories/repository-error";

export type MonthlyMembershipRecord = {
  id: string;
  customerName: string;
  whatsapp: string;
  planName: string;
  monthlyAmount: number;
  dueDay: number;
  active: boolean;
  notes: string;
  createdAt?: string;
  updatedAt?: string;
};

export type MonthlyMembershipPayment = {
  id: string;
  membershipId: string;
  referenceMonth: string;
  amount: number;
  paidAt: string;
};

type MembershipRow = {
  id: string;
  customer_name: string;
  whatsapp: string;
  plan_name: string;
  monthly_amount: number | string;
  due_day: number;
  active: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
};

type PaymentRow = {
  id: string;
  membership_id: string;
  reference_month: string;
  amount: number | string;
  paid_at: string;
};

const membershipsKey = "kings-barber-monthly-memberships";
const paymentsKey = "kings-barber-monthly-payments";

export function getReferenceMonth(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}-01`;
}

export async function listMonthlyMemberships(): Promise<MonthlyMembershipRecord[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("monthly_memberships")
      .select("*")
      .order("active", { ascending: false })
      .order("customer_name");
    if (error) throwRepositoryError("carregar os mensalistas", error);
    return (data ?? []).map(fromMembershipRow);
  }

  return readLocal<MonthlyMembershipRecord>(membershipsKey);
}

export async function listMonthlyMembershipPayments(
  referenceMonth = getReferenceMonth(),
): Promise<MonthlyMembershipPayment[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("monthly_membership_payments")
      .select("id,membership_id,reference_month,amount,paid_at")
      .eq("reference_month", referenceMonth)
      .order("paid_at", { ascending: false });
    if (error) throwRepositoryError("carregar os pagamentos mensais", error);
    return (data ?? []).map(fromPaymentRow);
  }

  return readLocal<MonthlyMembershipPayment>(paymentsKey).filter(
    (payment) => payment.referenceMonth === referenceMonth,
  );
}

export async function saveMonthlyMembership(
  membership: MonthlyMembershipRecord,
): Promise<MonthlyMembershipRecord> {
  if (supabase) {
    const { data, error } = await supabase
      .from("monthly_memberships")
      .upsert(toMembershipRow(membership))
      .select("*")
      .single();
    if (error) throwRepositoryError("salvar o mensalista", error);
    return fromMembershipRow(data);
  }

  return upsertLocal(membershipsKey, membership);
}

export async function deleteMonthlyMembership(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("monthly_memberships").delete().eq("id", id);
    if (error) throwRepositoryError("excluir o mensalista", error);
    return;
  }

  writeLocal(
    membershipsKey,
    readLocal<MonthlyMembershipRecord>(membershipsKey).filter((item) => item.id !== id),
  );
  writeLocal(
    paymentsKey,
    readLocal<MonthlyMembershipPayment>(paymentsKey).filter(
      (payment) => payment.membershipId !== id,
    ),
  );
}

export async function markMonthlyMembershipPaid(
  membership: MonthlyMembershipRecord,
  referenceMonth = getReferenceMonth(),
): Promise<MonthlyMembershipPayment> {
  const payment = {
    id: crypto.randomUUID(),
    membership_id: membership.id,
    reference_month: referenceMonth,
    amount: membership.monthlyAmount,
    paid_at: new Date().toISOString(),
  };

  if (supabase) {
    const { data, error } = await supabase
      .from("monthly_membership_payments")
      .upsert(payment, { onConflict: "membership_id,reference_month" })
      .select("id,membership_id,reference_month,amount,paid_at")
      .single();
    if (error) throwRepositoryError("registrar o pagamento mensal", error);
    return fromPaymentRow(data);
  }

  const saved = fromPaymentRow(payment);
  const payments = readLocal<MonthlyMembershipPayment>(paymentsKey);
  const next = payments.some(
    (item) => item.membershipId === membership.id && item.referenceMonth === referenceMonth,
  )
    ? payments.map((item) =>
        item.membershipId === membership.id && item.referenceMonth === referenceMonth
          ? saved
          : item,
      )
    : [...payments, saved];
  writeLocal(paymentsKey, next);
  return saved;
}

export async function unmarkMonthlyMembershipPaid(
  membershipId: string,
  referenceMonth = getReferenceMonth(),
): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from("monthly_membership_payments")
      .delete()
      .eq("membership_id", membershipId)
      .eq("reference_month", referenceMonth);
    if (error) throwRepositoryError("desfazer o pagamento mensal", error);
    return;
  }

  writeLocal(
    paymentsKey,
    readLocal<MonthlyMembershipPayment>(paymentsKey).filter(
      (payment) =>
        payment.membershipId !== membershipId || payment.referenceMonth !== referenceMonth,
    ),
  );
}

function fromMembershipRow(row: MembershipRow): MonthlyMembershipRecord {
  return {
    id: row.id,
    customerName: row.customer_name,
    whatsapp: row.whatsapp,
    planName: row.plan_name,
    monthlyAmount: Number(row.monthly_amount),
    dueDay: Number(row.due_day),
    active: row.active,
    notes: row.notes ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toMembershipRow(membership: MonthlyMembershipRecord): MembershipRow {
  return {
    id: membership.id,
    customer_name: membership.customerName.trim(),
    whatsapp: membership.whatsapp.trim(),
    plan_name: membership.planName.trim(),
    monthly_amount: membership.monthlyAmount,
    due_day: membership.dueDay,
    active: membership.active,
    notes: membership.notes.trim() || null,
    created_at: membership.createdAt,
    updated_at: new Date().toISOString(),
  };
}

function fromPaymentRow(row: PaymentRow): MonthlyMembershipPayment {
  return {
    id: row.id,
    membershipId: row.membership_id,
    referenceMonth: row.reference_month,
    amount: Number(row.amount),
    paidAt: row.paid_at,
  };
}

function readLocal<T>(key: string): T[] {
  try {
    return JSON.parse(window.localStorage.getItem(key) || "[]") as T[];
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
}

function writeLocal<T>(key: string, data: T[]) {
  window.localStorage.setItem(key, JSON.stringify(data));
}

function upsertLocal<T extends { id: string }>(key: string, item: T) {
  const items = readLocal<T>(key);
  const next = items.some((current) => current.id === item.id)
    ? items.map((current) => (current.id === item.id ? item : current))
    : [...items, item];
  writeLocal(key, next);
  return item;
}
