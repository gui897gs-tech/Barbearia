import type { Page, Route } from "@playwright/test";

export type MockRole = "owner" | "barber" | "client";

const storageKey = "sb-mock-auth-token";
const now = new Date();
const today = formatDate(now);
const tomorrow = formatDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1));
const lastMonth = formatDate(new Date(now.getFullYear(), now.getMonth() - 1, 12));

const services = [
  {
    id: "service-cut",
    name: "Corte Signature",
    duration: 45,
    price: 75,
    category: "Cabelo",
    active: true,
    created_at: `${today}T09:00:00-03:00`,
  },
  {
    id: "service-beard",
    name: "Barba Real",
    duration: 30,
    price: 55,
    category: "Barba",
    active: true,
    created_at: `${today}T09:00:00-03:00`,
  },
];

const barbers = [
  {
    id: "barber-profile",
    name: "Miguel Reis",
    title: "Master barber",
    rating: 4.9,
    image: avatar("MR"),
    revenue: 0,
    appts: 0,
    commission: 0,
    commission_rate: 0,
    fixed_fee: 500,
    email: "miguel@kingsbarber.test",
    access_status: "active",
    access_user_id: "barber-user",
    active: true,
    bio: "Especialista em cortes clássicos e acabamento contemporâneo.",
    phone: "(11) 99999-1001",
    specialties: ["Tesoura", "Fade", "Barba"],
    created_at: `${today}T08:00:00-03:00`,
  },
  {
    id: "barber-second",
    name: "Rafael Torres",
    title: "Barbeiro sênior",
    rating: 4.8,
    image: avatar("RT"),
    revenue: 0,
    appts: 0,
    commission: 0,
    commission_rate: 0,
    fixed_fee: 500,
    email: "rafael@kingsbarber.test",
    access_status: "active",
    access_user_id: "barber-second-user",
    active: true,
    bio: "Cortes precisos, desenho de barba e atendimento cuidadoso.",
    phone: "(11) 99999-1002",
    specialties: ["Navalha", "Barba"],
    created_at: `${today}T08:10:00-03:00`,
  },
];

const products = [
  {
    id: "p1",
    name: "Pomada Modeladora",
    stock: 24,
    price: 45,
    sold: 18,
    active: true,
    created_at: `${today}T08:00:00-03:00`,
  },
  {
    id: "p2",
    name: "Gel de Cabelo",
    stock: 18,
    price: 28,
    sold: 11,
    active: true,
    created_at: `${today}T08:00:00-03:00`,
  },
  {
    id: "p3",
    name: "Laquê",
    stock: 12,
    price: 35,
    sold: 7,
    active: true,
    created_at: `${today}T08:00:00-03:00`,
  },
];

const customers = [
  {
    id: "client-user",
    name: "Daniel Martins",
    whatsapp: "(11) 98888-2200",
    email: "daniel@cliente.test",
    instagram: "@danielmartins",
    birth_date: "1992-08-14",
    city: "São Paulo",
    avatar_url: null,
    favorite_barber: "Miguel Reis",
    favorite_cut: "Corte Signature",
    barber_notes: "Prefere acabamento natural.",
    internal_notes: "",
    last_visit: lastMonth,
    next_appointment: `${tomorrow}T11:00:00-03:00`,
    total_spent: 225,
    average_ticket: 75,
    visits: 3,
    frequency_days: 28,
    status: "active",
    loyalty_points: 240,
    created_at: `${lastMonth}T10:00:00-03:00`,
  },
];

const history = [
  {
    id: "history-1",
    customer_id: "client-user",
    visited_at: lastMonth,
    service: "Corte Signature",
    barber: "Miguel Reis",
    paid: 75,
  },
];

const settings = {
  id: true,
  name: "King's Barber",
  address: "Alameda dos Barbeiros, 125 — São Paulo",
  phone: "(11) 3333-4400",
  email: "contato@kingsbarber.test",
  timezone: "America/Sao_Paulo",
  weekday_start: "09:00",
  weekday_end: "19:00",
  saturday_start: "09:00",
  saturday_end: "18:00",
  sunday_closed: true,
  cancellation_hours: 12,
};

export async function installAuthenticatedSupabase(page: Page, role: MockRole) {
  const user = createUser(role);
  const session = createSession(user);
  const appointments = createAppointments();

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, JSON.stringify(value));
      window.localStorage.setItem("kings-barber-theme", "light");
    },
    { key: storageKey, value: session },
  );

  await page.route("https://mock.supabase.co/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const { pathname } = url;

    if (pathname === "/auth/v1/user") {
      await respond(route, user);
      return;
    }

    if (pathname === "/auth/v1/logout") {
      await respond(route, {});
      return;
    }

    if (pathname === "/rest/v1/rpc/get_available_slots") {
      await respond(
        route,
        ["09:00", "10:00", "11:30", "14:00", "16:30"].map((slot) => ({ slot })),
      );
      return;
    }

    if (pathname === "/rest/v1/rpc/book_appointment") {
      const input = postData(request.postData());
      appointments.push({
        id: "appointment-new",
        time: String(input.p_time ?? "09:00").slice(0, 5),
        client_name: "Daniel Martins",
        service_name: "Corte Signature",
        barber_name: "Miguel Reis",
        status: "Confirmado",
        price: 75,
        appointment_date: String(input.p_date ?? today),
        starts_at: `${String(input.p_date ?? today)}T${String(input.p_time ?? "09:00")}:00-03:00`,
        duration_minutes: 45,
        customer_id: "client-user",
        barber_id: String(input.p_barber_id ?? "barber-profile"),
        service_id: String(input.p_service_id ?? "service-cut"),
        notes: input.p_notes ?? null,
        created_at: new Date().toISOString(),
      });
      await respond(route, "appointment-new");
      return;
    }

    if (pathname === "/rest/v1/rpc/update_own_appointment_status") {
      const input = postData(request.postData());
      const appointment = appointments.find((item) => item.id === input.p_appointment_id);
      if (appointment) appointment.status = String(input.p_status);
      await respond(route, true);
      return;
    }

    if (pathname === "/rest/v1/rpc/cancel_appointment") {
      const input = postData(request.postData());
      const appointment = appointments.find((item) => item.id === input.p_appointment_id);
      if (appointment) appointment.status = "Cancelado pelo cliente";
      await respond(route, true);
      return;
    }

    if (
      pathname === "/rest/v1/rpc/update_barber_profile" ||
      pathname === "/rest/v1/rpc/update_client_profile"
    ) {
      await respond(route, true);
      return;
    }

    if (pathname === "/rest/v1/services") {
      await respond(route, rowResponse(request, services));
      return;
    }

    if (pathname === "/rest/v1/products") {
      await respond(route, rowResponse(request, products));
      return;
    }

    if (pathname === "/rest/v1/barber_directory") {
      const directory = barbers.map(
        ({ email: _email, access_status: _status, access_user_id: _userId, ...item }) => item,
      );
      await respond(route, directory);
      return;
    }

    if (pathname === "/rest/v1/barbers") {
      const selected = url.searchParams.has("access_user_id") ? barbers[0] : undefined;
      await respond(route, selected ?? rowResponse(request, barbers));
      return;
    }

    if (pathname === "/rest/v1/appointments") {
      if (request.method() !== "GET") {
        await respond(route, rowResponse(request, appointments[0]));
        return;
      }
      let selected = [...appointments];
      const customerFilter = url.searchParams.get("customer_id");
      const barberFilter = url.searchParams.get("barber_id");
      const dateFilter = url.searchParams.get("appointment_date");
      if (customerFilter)
        selected = selected.filter((item) => item.customer_id === stripEq(customerFilter));
      if (barberFilter)
        selected = selected.filter((item) => item.barber_id === stripEq(barberFilter));
      if (dateFilter)
        selected = selected.filter((item) => item.appointment_date === stripEq(dateFilter));
      await respond(route, rowResponse(request, selected));
      return;
    }

    if (pathname === "/rest/v1/business_settings") {
      const body =
        request.method() === "GET" ? settings : { ...settings, ...postData(request.postData()) };
      await respond(route, body);
      return;
    }

    if (pathname === "/rest/v1/customers") {
      const profileLookup = url.searchParams.get("id") === "eq.client-user";
      await respond(route, profileLookup ? customers[0] : rowResponse(request, customers));
      return;
    }

    if (pathname === "/rest/v1/customer_history") {
      await respond(route, history);
      return;
    }

    await route.fulfill({
      status: 404,
      json: { message: `Unhandled Playwright Supabase endpoint: ${pathname}` },
    });
  });
}

function createUser(role: MockRole) {
  const identities = {
    owner: { id: "owner-user", email: "gestor@kingsbarber.test", fullName: "Henrique Andrade" },
    barber: { id: "barber-user", email: "miguel@kingsbarber.test", fullName: "Miguel Reis" },
    client: { id: "client-user", email: "daniel@cliente.test", fullName: "Daniel Martins" },
  } as const;
  const identity = identities[role];
  return {
    id: identity.id,
    aud: "authenticated",
    role: "authenticated",
    email: identity.email,
    email_confirmed_at: `${today}T08:00:00.000Z`,
    phone: "",
    confirmed_at: `${today}T08:00:00.000Z`,
    last_sign_in_at: `${today}T08:00:00.000Z`,
    app_metadata: { provider: "email", providers: ["email"], role },
    user_metadata: {
      email: identity.email,
      email_verified: true,
      full_name: identity.fullName,
      phone: role === "client" ? "(11) 98888-2200" : "(11) 99999-1000",
      birth_date: role === "client" ? "1992-08-14" : null,
    },
    identities: [],
    created_at: `${lastMonth}T10:00:00.000Z`,
    updated_at: `${today}T08:00:00.000Z`,
    is_anonymous: false,
  };
}

function createSession(user: ReturnType<typeof createUser>) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const accessToken = jwt({
    aud: "authenticated",
    exp: issuedAt + 60 * 60,
    iat: issuedAt,
    sub: user.id,
    email: user.email,
    role: "authenticated",
    app_metadata: user.app_metadata,
    user_metadata: user.user_metadata,
  });
  return {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: issuedAt + 3600,
    refresh_token: `playwright-${user.id}-refresh-token`,
    user,
  };
}

function createAppointments() {
  return [
    {
      id: "appointment-today-1",
      time: "10:00",
      client_name: "Daniel Martins",
      service_name: "Corte Signature",
      barber_name: "Miguel Reis",
      status: "Confirmado",
      price: 75,
      appointment_date: today,
      starts_at: `${today}T10:00:00-03:00`,
      duration_minutes: 45,
      customer_id: "customer-owner-view",
      barber_id: "barber-profile",
      service_id: "service-cut",
      notes: "Acabamento natural, sem baixar muito o topo.",
      created_at: `${today}T08:00:00-03:00`,
    },
    {
      id: "appointment-today-2",
      time: "14:30",
      client_name: "Bruno Oliveira",
      service_name: "Barba Real",
      barber_name: "Miguel Reis",
      status: "Concluído",
      price: 55,
      appointment_date: today,
      starts_at: `${today}T14:30:00-03:00`,
      duration_minutes: 30,
      customer_id: "customer-bruno",
      barber_id: "barber-profile",
      service_id: "service-beard",
      notes: null,
      created_at: `${today}T08:00:00-03:00`,
    },
    {
      id: "appointment-client-next",
      time: "11:00",
      client_name: "Daniel Martins",
      service_name: "Corte Signature",
      barber_name: "Miguel Reis",
      status: "Confirmado",
      price: 75,
      appointment_date: tomorrow,
      starts_at: `${tomorrow}T11:00:00-03:00`,
      duration_minutes: 45,
      customer_id: "client-user",
      barber_id: "barber-profile",
      service_id: "service-cut",
      notes: null,
      created_at: `${today}T08:00:00-03:00`,
    },
    {
      id: "appointment-client-past",
      time: "15:00",
      client_name: "Daniel Martins",
      service_name: "Corte Signature",
      barber_name: "Miguel Reis",
      status: "Concluído",
      price: 75,
      appointment_date: lastMonth,
      starts_at: `${lastMonth}T15:00:00-03:00`,
      duration_minutes: 45,
      customer_id: "client-user",
      barber_id: "barber-profile",
      service_id: "service-cut",
      notes: null,
      created_at: `${lastMonth}T12:00:00-03:00`,
    },
  ];
}

function rowResponse(request: { headers(): Record<string, string> }, value: unknown) {
  const wantsObject = request.headers().accept?.includes("application/vnd.pgrst.object+json");
  if (!wantsObject) return value;
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

async function respond(route: Route, json: unknown) {
  await route.fulfill({
    status: 200,
    headers: { "Content-Type": "application/json", "Content-Range": "0-99/*" },
    body: JSON.stringify(json),
  });
}

function postData(value: string | null): Record<string, unknown> {
  if (!value) return {};
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function stripEq(value: string) {
  return value.startsWith("eq.") ? value.slice(3) : value;
}

function formatDate(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function jwt(payload: Record<string, unknown>) {
  return [base64Url({ alg: "HS256", typ: "JWT" }), base64Url(payload), "playwright-signature"].join(
    ".",
  );
}

function base64Url(value: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(value))
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function avatar(initials: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><rect width="240" height="240" fill="#28231f"/><circle cx="120" cy="104" r="52" fill="#b78a48"/><path d="M38 240c8-55 42-85 82-85s74 30 82 85" fill="#b78a48"/><text x="120" y="118" text-anchor="middle" font-family="serif" font-size="34" fill="#fff8eb">${initials}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
