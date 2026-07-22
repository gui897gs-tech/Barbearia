import { supabase } from "@/integrations/supabase/client";
import { throwRepositoryError } from "@/data/repositories/repository-error";

export type CustomerStatus = "active" | "missing" | "inactive" | "vip";

export type Customer = {
  id: string;
  name: string;
  whatsapp: string;
  email: string | null;
  instagram: string | null;
  birth_date: string | null;
  city: string | null;
  avatar_url: string | null;
  favorite_barber: string | null;
  favorite_cut: string | null;
  barber_notes: string | null;
  internal_notes: string | null;
  last_visit: string | null;
  next_appointment: string | null;
  total_spent: number;
  average_ticket: number;
  visits: number;
  frequency_days: number;
  status: CustomerStatus;
  loyalty_points: number;
  created_at: string;
};

export type CustomerHistory = {
  id: string;
  customer_id: string;
  visited_at: string;
  service: string;
  barber: string;
  paid: number;
};

export type CustomerInput = Omit<Customer, "id" | "created_at">;

const customerStorageKey = "kings-barber-customers";
const historyStorageKey = "kings-barber-customer-history";
const legacyStorageKeys: Record<string, string> = {
  [customerStorageKey]: "maison-lame-customers",
  [historyStorageKey]: "maison-lame-customer-history",
};

export const customerSeed: Customer[] = [
  {
    id: "c1",
    name: "Joao Silva",
    whatsapp: "(11) 98765-4321",
    email: "joao.silva@email.com",
    instagram: "@joaosilva",
    birth_date: "1990-03-15",
    city: "Sao Paulo",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=80",
    favorite_barber: "Lucas Moreau",
    favorite_cut: "Fade medio",
    barber_notes: "Gosta do fade medio. Nao cortar muito em cima.",
    internal_notes: "Cliente VIP, prefere produto com pouco aroma.",
    last_visit: "2026-05-18",
    next_appointment: "2026-05-25T10:00:00",
    total_spent: 420,
    average_ticket: 52.5,
    visits: 8,
    frequency_days: 21,
    status: "vip",
    loyalty_points: 980,
    created_at: "2026-01-12T10:00:00",
  },
  {
    id: "c2",
    name: "Pedro Santos",
    whatsapp: "(11) 97654-3210",
    email: "pedro@email.com",
    instagram: "@pedrosantos",
    birth_date: "1988-05-22",
    city: "Sao Paulo",
    avatar_url: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=160&q=80",
    favorite_barber: "Adrian Cole",
    favorite_cut: "Corte social",
    barber_notes: "Prefere acabamento discreto.",
    internal_notes: "Enviar lembrete mensal.",
    last_visit: "2026-05-16",
    next_appointment: "2026-05-23T14:00:00",
    total_spent: 280,
    average_ticket: 70,
    visits: 4,
    frequency_days: 28,
    status: "active",
    loyalty_points: 420,
    created_at: "2026-02-02T10:00:00",
  },
  {
    id: "c3",
    name: "Carlos Ferreira",
    whatsapp: "(11) 95432-1098",
    email: "carlos@email.com",
    instagram: "@carlosferreira",
    birth_date: "1984-08-04",
    city: "Osasco",
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&q=80",
    favorite_barber: "Lucas Moreau",
    favorite_cut: "Barba real",
    barber_notes: "Barba alinhada, sem baixar muito.",
    internal_notes: "Compra oleo de barba com frequencia.",
    last_visit: "2026-05-10",
    next_appointment: null,
    total_spent: 680,
    average_ticket: 85,
    visits: 8,
    frequency_days: 35,
    status: "vip",
    loyalty_points: 760,
    created_at: "2026-01-20T10:00:00",
  },
  {
    id: "c4",
    name: "Lucas Almeida",
    whatsapp: "(11) 96543-2109",
    email: "lucas@email.com",
    instagram: "@lucasalmeida",
    birth_date: "1995-11-10",
    city: "Sao Paulo",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80",
    favorite_barber: "Adrian Cole",
    favorite_cut: "Corte infantil",
    barber_notes: "Corte pratico, laterais baixas.",
    internal_notes: "Cliente recorrente de sabado.",
    last_visit: "2026-05-02",
    next_appointment: "2026-05-16T11:00:00",
    total_spent: 195,
    average_ticket: 65,
    visits: 3,
    frequency_days: 30,
    status: "active",
    loyalty_points: 210,
    created_at: "2026-03-04T10:00:00",
  },
  {
    id: "c5",
    name: "Rafael Costa",
    whatsapp: "(11) 99876-5432",
    email: "rafael@email.com",
    instagram: "@rafaelcosta",
    birth_date: "1991-07-18",
    city: "Guarulhos",
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=160&q=80",
    favorite_barber: "Lucas Moreau",
    favorite_cut: "Experiência Real",
    barber_notes: "Atendimento premium completo.",
    internal_notes: "Sumido, chamar por WhatsApp.",
    last_visit: "2026-04-20",
    next_appointment: null,
    total_spent: 0,
    average_ticket: 0,
    visits: 0,
    frequency_days: 90,
    status: "inactive",
    loyalty_points: 0,
    created_at: "2026-04-01T10:00:00",
  },
  {
    id: "c6",
    name: "Gabriel Lima",
    whatsapp: "(11) 93456-7891",
    email: "gabriel@email.com",
    instagram: "@gabriellima",
    birth_date: "1993-05-30",
    city: "Sao Paulo",
    avatar_url: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&q=80",
    favorite_barber: "Adrian Cole",
    favorite_cut: "Modelagem de barba",
    barber_notes: "Barba quadrada, acabamento navalha.",
    internal_notes: "Aniversariante do mes.",
    last_visit: "2026-04-15",
    next_appointment: null,
    total_spent: 150,
    average_ticket: 75,
    visits: 2,
    frequency_days: 45,
    status: "missing",
    loyalty_points: 160,
    created_at: "2026-02-19T10:00:00",
  },
];

export const customerHistorySeed: CustomerHistory[] = customerSeed.flatMap((customer) =>
  Array.from({ length: Math.min(customer.visits, 4) }, (_, index) => ({
    id: `${customer.id}-h-${index}`,
    customer_id: customer.id,
    visited_at:
      index === 0
        ? customer.last_visit || "2026-05-01"
        : `2026-0${Math.max(1, 5 - index)}-1${index}`,
    service: customer.favorite_cut || "Corte Signature",
    barber: customer.favorite_barber || "Lucas Moreau",
    paid: Math.round(customer.average_ticket || 80),
  })),
);

function readLocal<T>(key: string, fallback: T): T {
  const legacyKey = legacyStorageKeys[key];
  const saved =
    window.localStorage.getItem(key) ?? (legacyKey ? window.localStorage.getItem(legacyKey) : null);
  if (!saved) return fallback;
  try {
    const parsed = JSON.parse(saved) as T;
    window.localStorage.setItem(key, saved);
    if (legacyKey) window.localStorage.removeItem(legacyKey);
    return parsed;
  } catch {
    window.localStorage.removeItem(key);
    if (legacyKey) window.localStorage.removeItem(legacyKey);
    return fallback;
  }
}

function writeLocal<T>(key: string, data: T) {
  window.localStorage.setItem(key, JSON.stringify(data));
}

export async function listCustomers() {
  if (supabase) {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throwRepositoryError("carregar os clientes", error);
    return (data ?? []) as Customer[];
  }
  return readLocal(customerStorageKey, customerSeed);
}

export async function listCustomerHistory(customerId?: string) {
  if (supabase) {
    let query = supabase
      .from("customer_history")
      .select("*")
      .order("visited_at", { ascending: false });
    if (customerId) query = query.eq("customer_id", customerId);
    const { data, error } = await query;
    if (error) throwRepositoryError("carregar o histórico do cliente", error);
    return (data ?? []) as CustomerHistory[];
  }
  const history = readLocal(historyStorageKey, customerHistorySeed);
  return customerId ? history.filter((item) => item.customer_id === customerId) : history;
}

export async function createCustomer(input: CustomerInput) {
  if (supabase) {
    const { data, error } = await supabase.from("customers").insert(input).select("*").single();
    if (error) throwRepositoryError("criar o cliente", error);
    return data as Customer;
  }

  const next = { ...input, id: `c-${Date.now()}`, created_at: new Date().toISOString() };
  const customers = readLocal(customerStorageKey, customerSeed);
  writeLocal(customerStorageKey, [next, ...customers]);
  return next;
}

export async function updateCustomer(customer: Customer) {
  const { id, created_at: _createdAt, ...input } = customer;
  if (supabase) {
    const { data, error } = await supabase
      .from("customers")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    if (error) throwRepositoryError("atualizar o cliente", error);
    return data as Customer;
  }

  const customers = readLocal(customerStorageKey, customerSeed);
  writeLocal(
    customerStorageKey,
    customers.map((item) => (item.id === id ? customer : item)),
  );
  return customer;
}

export async function deleteCustomer(customerId: string) {
  if (supabase) {
    const { error } = await supabase.from("customers").delete().eq("id", customerId);
    if (error) throwRepositoryError("excluir o cliente", error);
    return;
  }

  const customers = readLocal(customerStorageKey, customerSeed);
  writeLocal(
    customerStorageKey,
    customers.filter((item) => item.id !== customerId),
  );
}
