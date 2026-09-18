import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REAL_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const anonKey = process.env.REAL_SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.REAL_SUPABASE_SERVICE_ROLE_KEY;
const appUrl = process.env.REAL_APP_URL ?? "https://kings-barber-management-eight.vercel.app";

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error(
    "Defina REAL_SUPABASE_URL, REAL_SUPABASE_ANON_KEY e REAL_SUPABASE_SERVICE_ROLE_KEY.",
  );
}

const clientOptions = {
  auth: { autoRefreshToken: false, persistSession: false },
};
const admin = createClient(supabaseUrl, serviceRoleKey, clientOptions);
const suffix = randomUUID();
const password = `Homolog-${randomUUID()}-Aa1!`;
const ownerEmail = `owner-homolog-${suffix}@example.com`;
// Supabase validates MX records for invitation emails, so the reserved example.com
// domain cannot exercise the real invite path.
const barberEmail = `barber-homolog-${suffix}@gmail.com`;
const clientAEmail = `client-a-homolog-${suffix}@example.com`;
const clientBEmail = `client-b-homolog-${suffix}@example.com`;
const serviceId = `homolog-service-${suffix}`;
const blockedServiceId = `blocked-service-${suffix}`;
const createdUserIds = [];
let ownerId;
let invitedBarberUserId;
let barberId;
let ownerAccessToken;

function assertNoError(result, context) {
  assert.equal(result.error, null, `${context}: ${result.error?.message ?? "erro desconhecido"}`);
  return result.data;
}

async function createUser(email, role, fullName) {
  const result = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { role },
    user_metadata: { full_name: fullName },
  });
  const user = assertNoError(result, `Criar usuário ${role}`).user;
  assert.ok(user?.id, `Usuário ${role} não retornou id`);
  createdUserIds.push(user.id);
  return user.id;
}

async function signIn(email) {
  const client = createClient(supabaseUrl, anonKey, clientOptions);
  const result = await client.auth.signInWithPassword({ email, password });
  const session = assertNoError(result, `Login de ${email}`).session;
  assert.ok(session?.access_token, `Login de ${email} não retornou sessão`);
  return { client, accessToken: session.access_token };
}

async function callEdgeFunction(name, accessToken, body) {
  const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      Origin: appUrl,
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  assert.equal(
    response.ok,
    true,
    `${name} retornou HTTP ${response.status}: ${payload.error ?? "resposta inválida"}`,
  );
  return payload;
}

function saoPauloDate(daysAhead) {
  const cursor = new Date(Date.now() + daysAhead * 86_400_000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(cursor);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function findAvailableSlot(client, startingDaysAhead = 2) {
  for (let offset = startingDaysAhead; offset < startingDaysAhead + 14; offset += 1) {
    const date = saoPauloDate(offset);
    const result = await client.rpc("get_available_slots", {
      p_barber_id: barberId,
      p_service_id: serviceId,
      p_date: date,
    });
    const slots = assertNoError(result, `Consultar horários de ${date}`);
    if (slots?.length) return { date, time: slots[0].slot };
  }
  throw new Error("Nenhum horário de homologação ficou disponível nos próximos 14 dias.");
}

async function run() {
  try {
    ownerId = await createUser(ownerEmail, "owner", "Owner Homologação");
    const ownerLogin = await signIn(ownerEmail);
    ownerAccessToken = ownerLogin.accessToken;

    const invitation = await callEdgeFunction("create-barber", ownerAccessToken, {
      name: "Barbeiro Homologação",
      email: barberEmail,
      title: "Barbeiro de teste",
      image: "",
      fixedFee: 0,
    });
    invitedBarberUserId = invitation.user?.id;
    barberId = invitation.barber?.id;
    assert.ok(invitedBarberUserId && barberId, "Convite não retornou usuário e perfil do barbeiro");
    createdUserIds.push(invitedBarberUserId);

    assertNoError(
      await admin.auth.admin.updateUserById(invitedBarberUserId, {
        password,
        email_confirm: true,
      }),
      "Definir senha do barbeiro convidado",
    );

    const clientAId = await createUser(clientAEmail, "client", "Cliente Homologação A");
    const clientBId = await createUser(clientBEmail, "client", "Cliente Homologação B");
    const barberLogin = await signIn(barberEmail);
    const clientALogin = await signIn(clientAEmail);
    const clientBLogin = await signIn(clientBEmail);

    assertNoError(
      await admin.from("services").insert({
        id: serviceId,
        name: "Serviço Homologação",
        category: "Teste",
        duration: 30,
        price: 40,
        active: true,
      }),
      "Criar serviço de homologação",
    );
    assertNoError(
      await admin.from("barber_service_prices").insert({
        barber_id: barberId,
        service_id: serviceId,
        price: 47.5,
      }),
      "Criar preço específico do barbeiro",
    );

    const slot = await findAvailableSlot(clientALogin.client);
    const bookingPayload = {
      p_barber_id: barberId,
      p_service_id: serviceId,
      p_date: slot.date,
      p_time: slot.time,
      p_notes: "Homologação de concorrência",
    };
    const attempts = await Promise.all([
      clientALogin.client.rpc("book_appointment", bookingPayload),
      clientBLogin.client.rpc("book_appointment", bookingPayload),
    ]);
    const successfulAttempts = attempts.filter(({ error }) => !error);
    const rejectedAttempts = attempts.filter(({ error }) => error);
    assert.equal(successfulAttempts.length, 1, "Duas reservas simultâneas foram persistidas");
    assert.equal(rejectedAttempts.length, 1, "A colisão de agenda não foi rejeitada");
    const appointmentId = successfulAttempts[0].data;

    const appointment = assertNoError(
      await admin
        .from("appointments")
        .select("id,customer_id,price,status")
        .eq("id", appointmentId)
        .single(),
      "Ler reserva concorrente",
    );
    assert.equal(Number(appointment.price), 47.5, "O preço específico não foi aplicado no banco");

    const ownerAppointments = assertNoError(
      await ownerLogin.client.from("appointments").select("id").eq("id", appointmentId),
      "RLS do proprietário",
    );
    const barberAppointments = assertNoError(
      await barberLogin.client.from("appointments").select("id").eq("id", appointmentId),
      "RLS do barbeiro",
    );
    const clientAAppointments = assertNoError(
      await clientALogin.client.from("appointments").select("id").eq("id", appointmentId),
      "RLS do cliente A",
    );
    const clientBAppointments = assertNoError(
      await clientBLogin.client.from("appointments").select("id").eq("id", appointmentId),
      "RLS do cliente B",
    );
    assert.equal(ownerAppointments.length, 1, "O proprietário não enxerga a reserva");
    assert.equal(barberAppointments.length, 1, "O barbeiro vinculado não enxerga a reserva");
    assert.equal(
      clientAAppointments.length + clientBAppointments.length,
      1,
      "A reserva vazou entre clientes",
    );

    const forbiddenInsert = await clientALogin.client
      .from("services")
      .insert({ id: blockedServiceId, name: "Bloqueado", active: false })
      .select("id");
    assert.ok(forbiddenInsert.error, "Um cliente conseguiu criar um serviço");

    assertNoError(
      await barberLogin.client.rpc("update_own_appointment_status", {
        p_appointment_id: appointmentId,
        p_status: "Concluído",
      }),
      "Concluir atendimento como barbeiro",
    );
    const customerMetrics = assertNoError(
      await admin
        .from("customers")
        .select("visits,total_spent,average_ticket")
        .eq("id", appointment.customer_id)
        .single(),
      "Ler métricas recalculadas",
    );
    assert.equal(customerMetrics.visits, 1, "A visita concluída não atualizou o cliente");
    assert.equal(Number(customerMetrics.total_spent), 47.5, "O gasto total não foi recalculado");
    assert.equal(
      Number(customerMetrics.average_ticket),
      47.5,
      "O ticket médio não foi recalculado",
    );

    const winningClient =
      appointment.customer_id === clientAId ? clientALogin.client : clientBLogin.client;
    const cancelSlot = await findAvailableSlot(winningClient, 7);
    const cancelBooking = assertNoError(
      await winningClient.rpc("book_appointment", {
        ...bookingPayload,
        p_date: cancelSlot.date,
        p_time: cancelSlot.time,
        p_notes: "Homologação de cancelamento",
      }),
      "Criar reserva para cancelamento",
    );
    assertNoError(
      await winningClient.rpc("cancel_appointment", { p_appointment_id: cancelBooking }),
      "Cancelar reserva dentro da regra configurada",
    );

    assertNoError(
      await admin.from("owner_invite_rate_limits").delete().eq("owner_id", ownerId),
      "Limpar quota antes do teste",
    );
    const quotaResults = await Promise.all(
      Array.from({ length: 6 }, () =>
        admin.rpc("consume_owner_invite_quota", { p_owner_id: ownerId }),
      ),
    );
    quotaResults.forEach((result) => assertNoError(result, "Consumir quota de convite"));
    assert.equal(
      quotaResults.filter(({ data }) => data === true).length,
      5,
      "A quota não aceitou exatamente cinco convites",
    );
    assert.equal(
      quotaResults.filter(({ data }) => data === false).length,
      1,
      "A sexta tentativa de convite não foi bloqueada",
    );

    await callEdgeFunction("delete-barber", ownerAccessToken, { barberId });
    createdUserIds.splice(createdUserIds.indexOf(invitedBarberUserId), 1);
    invitedBarberUserId = undefined;
    barberId = undefined;

    console.log(
      JSON.stringify(
        {
          status: "ok",
          verified: [
            "create/delete barber Edge Functions",
            "owner/barber/client RLS",
            "atomic appointment concurrency",
            "authoritative barber price",
            "customer metrics trigger",
            "customer cancellation",
            "distributed invitation quota",
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    if (barberId) {
      await admin.from("appointments").delete().eq("barber_id", barberId);
      await admin.from("barber_service_prices").delete().eq("barber_id", barberId);
      await admin.from("barbers").delete().eq("id", barberId);
    }
    await admin.from("services").delete().in("id", [serviceId, blockedServiceId]);
    if (ownerId) await admin.from("owner_invite_rate_limits").delete().eq("owner_id", ownerId);
    for (const userId of [...createdUserIds].reverse()) {
      await admin.auth.admin.deleteUser(userId);
    }
  }
}

await run();
