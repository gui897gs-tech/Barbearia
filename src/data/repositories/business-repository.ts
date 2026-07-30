import {
  appointments as appointmentSeed,
  employeePerf,
  products as productSeed,
  services as serviceSeed,
} from "@/data/demo/sample-data";
import { supabase } from "@/integrations/supabase/client";
import { throwRepositoryError } from "@/data/repositories/repository-error";
import { buildTimeSlots, filterAvailableSlots } from "@/shared/domain/booking";

export type ServiceRecord = (typeof serviceSeed)[number] & {
  active?: boolean;
  created_at?: string;
};

export type ProductRecord = (typeof productSeed)[number] & {
  active?: boolean;
  created_at?: string;
};

export type EmployeeRecord = (typeof employeePerf)[number] & {
  email?: string;
  accessStatus?: "pending" | "active" | "local";
  accessUserId?: string;
  active?: boolean;
  created_at?: string;
  bio?: string;
  phone?: string;
  specialties?: string[];
  commissionRate?: number;
  fixedFee?: number;
};

export type AppointmentRecord = (typeof appointmentSeed)[number] & {
  appointment_date?: string;
  starts_at?: string;
  duration_minutes?: number;
  customer_id?: string;
  barber_id?: string;
  service_id?: string;
  notes?: string;
  created_at?: string;
};

const storageKeys = {
  services: "kings-barber-services",
  products: "kings-barber-products",
  employees: "kings-barber-employees",
  appointments: "kings-barber-appointments",
  settings: "kings-barber-settings",
};

export type BusinessSettingsRecord = {
  name: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  weekdayStart: string;
  weekdayEnd: string;
  saturdayStart: string;
  saturdayEnd: string;
  sundayClosed: boolean;
  cancellationHours: number;
};

const defaultBusinessSettings: BusinessSettingsRecord = {
  name: "King's Barber",
  address: "",
  phone: "",
  email: "",
  timezone: "America/Sao_Paulo",
  weekdayStart: "09:00",
  weekdayEnd: "19:00",
  saturdayStart: "09:00",
  saturdayEnd: "19:00",
  sundayClosed: true,
  cancellationHours: 12,
};

type ServiceDatabaseRow = {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
  active?: boolean;
  created_at?: string;
};

type ProductDatabaseRow = {
  id: string;
  name: string;
  stock: number;
  price: number;
  sold: number;
  active?: boolean;
  created_at?: string;
};

type BarberDatabaseRow = {
  id: string;
  name: string;
  title: string;
  rating: number;
  image: string;
  revenue: number;
  appts: number;
  commission: number;
  email?: string;
  access_status?: EmployeeRecord["accessStatus"];
  access_user_id?: string;
  active?: boolean;
  created_at?: string;
  bio?: string;
  phone?: string;
  specialties?: string[];
  commission_rate?: number;
  fixed_fee?: number;
};

type AppointmentDatabaseRow = {
  id: string;
  time: string;
  client_name: string;
  service_name: string;
  barber_name: string;
  status: string;
  price: number;
  appointment_date?: string;
  starts_at?: string;
  duration_minutes?: number;
  customer_id?: string;
  barber_id?: string;
  service_id?: string;
  notes?: string;
  created_at?: string;
};

export async function listServices(): Promise<ServiceRecord[]> {
  if (supabase) {
    const { data, error } = await supabase.from("services").select("*").order("name");
    if (error) throwRepositoryError("carregar os serviços", error);
    return (data ?? []).map(fromServiceRow);
  }

  return readLocal<ServiceRecord>(storageKeys.services, serviceSeed);
}

export async function saveService(service: ServiceRecord): Promise<ServiceRecord> {
  if (supabase) {
    const payload = toServiceRow(service);
    const { data, error } = await supabase.from("services").upsert(payload).select("*").single();
    if (error) throwRepositoryError("salvar o serviço", error);
    return fromServiceRow(data);
  }

  return upsertLocal(storageKeys.services, serviceSeed, service);
}

export async function deleteService(id: string) {
  if (supabase) {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (error) throwRepositoryError("excluir o serviço", error);
    return;
  }

  deleteLocal(storageKeys.services, serviceSeed, id);
}

export async function listProducts(): Promise<ProductRecord[]> {
  if (supabase) {
    const { data, error } = await supabase.from("products").select("*").order("name");
    if (error) throwRepositoryError("carregar os produtos", error);
    return (data ?? []).map(fromProductRow);
  }

  return readLocal<ProductRecord>(storageKeys.products, productSeed);
}

export async function saveProduct(product: ProductRecord): Promise<ProductRecord> {
  if (supabase) {
    const payload = toProductRow(product);
    const { data, error } = await supabase.from("products").upsert(payload).select("*").single();
    if (error) throwRepositoryError("salvar o produto", error);
    return fromProductRow(data);
  }

  return upsertLocal(storageKeys.products, productSeed, product);
}

export async function deleteProduct(id: string) {
  if (supabase) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throwRepositoryError("excluir o produto", error);
    return;
  }

  deleteLocal(storageKeys.products, productSeed, id);
}

export async function listEmployees(): Promise<EmployeeRecord[]> {
  if (supabase) {
    const { data: authData } = await supabase.auth.getUser();
    const isOwner = authData.user?.app_metadata?.role === "owner";
    const { data, error } = await supabase
      .from(isOwner ? "barbers" : "barber_directory")
      .select("*")
      .order("name");
    if (error) throwRepositoryError("carregar a equipe", error);
    return (data ?? []).map(fromBarberRow);
  }

  return readLocal<EmployeeRecord>(storageKeys.employees, employeePerf);
}

export async function getBarberByUserId(userId: string): Promise<EmployeeRecord | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from("barbers")
      .select("*")
      .eq("access_user_id", userId)
      .maybeSingle();
    if (error) throwRepositoryError("carregar seu perfil profissional", error);
    return data ? fromBarberRow(data) : null;
  }

  return readLocal<EmployeeRecord>(storageKeys.employees, employeePerf)[0] ?? null;
}

export async function listBarberAppointments(
  barber: EmployeeRecord,
  date?: string,
): Promise<AppointmentRecord[]> {
  if (supabase) {
    let query = supabase
      .from("appointments")
      .select("*")
      .eq("barber_id", barber.id)
      .order("starts_at", { ascending: false })
      .limit(500);
    if (date) query = query.eq("appointment_date", date);
    const { data, error } = await query;
    if (error) throwRepositoryError("carregar sua agenda", error);
    return (data ?? []).map(fromAppointmentRow);
  }

  return readLocal<AppointmentRecord>(storageKeys.appointments, appointmentSeed).filter(
    (appointment) =>
      (appointment.barber_id === barber.id || appointment.barber === barber.name) &&
      (!date || appointment.appointment_date === date),
  );
}

export async function updateBarberProfile(
  barber: EmployeeRecord,
  profile: {
    name: string;
    title: string;
    image: string;
    bio: string;
    phone: string;
    specialties: string[];
  },
): Promise<EmployeeRecord> {
  if (supabase) {
    const { error } = await supabase.rpc("update_barber_profile", {
      p_name: profile.name,
      p_title: profile.title,
      p_image: profile.image,
      p_bio: profile.bio,
      p_phone: profile.phone,
      p_specialties: profile.specialties,
    });
    if (error) throwRepositoryError("atualizar seu perfil profissional", error);
    return { ...barber, ...profile };
  }

  return upsertLocal(storageKeys.employees, employeePerf, { ...barber, ...profile });
}

export type BarberAppointmentStatus =
  | "Confirmado"
  | "Em atendimento"
  | "Concluído"
  | "Não compareceu";

export async function updateBarberAppointmentStatus(
  appointmentId: string,
  status: BarberAppointmentStatus,
): Promise<void> {
  if (supabase) {
    const { error } = await supabase.rpc("update_own_appointment_status", {
      p_appointment_id: appointmentId,
      p_status: status,
    });
    if (error) throwRepositoryError("atualizar o atendimento", error);
    return;
  }

  const appointments = readLocal<AppointmentRecord>(storageKeys.appointments, appointmentSeed);
  writeLocal(
    storageKeys.appointments,
    appointments.map((appointment) =>
      appointment.id === appointmentId ? { ...appointment, status } : appointment,
    ),
  );
}

export async function saveEmployee(employee: EmployeeRecord): Promise<EmployeeRecord> {
  if (supabase) {
    const payload = toBarberRow(employee);
    const result = await supabase.from("barbers").upsert(payload).select("*").single();
    if (!result.error) return fromBarberRow(result.data);

    // Keep profile creation working while an older remote schema is waiting for
    // the fixed-fee migration. The configured value is retained in this session
    // and becomes persistent as soon as the migration is applied.
    if (isMissingOptionalBarberColumn(result.error)) {
      const legacyPayload = toLegacyBarberRow(employee);
      const legacyResult = await supabase
        .from("barbers")
        .upsert(legacyPayload)
        .select("*")
        .single();
      if (legacyResult.error) throwRepositoryError("salvar o profissional", legacyResult.error);
      return { ...fromBarberRow(legacyResult.data), fixedFee: employee.fixedFee ?? 0 };
    }

    throwRepositoryError("salvar o profissional", result.error);
  }

  return upsertLocal(storageKeys.employees, employeePerf, employee);
}

function isMissingOptionalBarberColumn(error: {
  code?: string;
  message?: string;
  details?: string;
}) {
  const description = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return (
    error.code === "PGRST204" ||
    error.code === "42703" ||
    description.includes("schema cache") ||
    description.includes("column")
  );
}

export async function deleteEmployee(id: string) {
  if (supabase) {
    const { data: employee, error: lookupError } = await supabase
      .from("barbers")
      .select("access_user_id")
      .eq("id", id)
      .maybeSingle();
    if (lookupError) throwRepositoryError("localizar o acesso do profissional", lookupError);

    if (employee?.access_user_id) {
      const { error } = await supabase.functions.invoke("delete-barber", {
        body: { barberId: id },
      });
      if (error) throwRepositoryError("revogar o acesso do profissional", error);
      return;
    }

    const { error } = await supabase.from("barbers").delete().eq("id", id);
    if (error) throwRepositoryError("excluir o profissional", error);
    return;
  }

  deleteLocal(storageKeys.employees, employeePerf, id);
}

export async function getBusinessSettings(): Promise<BusinessSettingsRecord> {
  if (supabase) {
    const { data, error } = await supabase
      .from("business_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();
    if (error) throwRepositoryError("carregar as configurações", error);
    return data ? fromBusinessSettingsRow(data) : defaultBusinessSettings;
  }

  if (typeof window === "undefined") return defaultBusinessSettings;
  const saved = window.localStorage.getItem(storageKeys.settings);
  if (!saved) return defaultBusinessSettings;
  try {
    return { ...defaultBusinessSettings, ...(JSON.parse(saved) as BusinessSettingsRecord) };
  } catch {
    window.localStorage.removeItem(storageKeys.settings);
    return defaultBusinessSettings;
  }
}

export async function saveBusinessSettings(
  settings: BusinessSettingsRecord,
): Promise<BusinessSettingsRecord> {
  if (supabase) {
    const { data, error } = await supabase
      .from("business_settings")
      .upsert(toBusinessSettingsRow(settings))
      .select("*")
      .single();
    if (error) throwRepositoryError("salvar as configurações", error);
    return fromBusinessSettingsRow(data);
  }

  window.localStorage.setItem(storageKeys.settings, JSON.stringify(settings));
  return settings;
}

export async function listAppointments(date?: string): Promise<AppointmentRecord[]> {
  if (supabase) {
    let query = supabase.from("appointments").select("*").order("time");
    if (date) query = query.eq("appointment_date", date);
    const { data, error } = await query;
    if (error) throwRepositoryError("carregar os agendamentos", error);
    return (data ?? []).map(fromAppointmentRow);
  }

  return readLocal<AppointmentRecord>(storageKeys.appointments, appointmentSeed);
}

export async function saveAppointment(appointment: AppointmentRecord): Promise<AppointmentRecord> {
  if (supabase) {
    const payload = toAppointmentRow(appointment);
    const { data, error } = await supabase
      .from("appointments")
      .upsert(payload)
      .select("*")
      .single();
    if (error) throwRepositoryError("salvar o agendamento", error);
    return fromAppointmentRow(data);
  }

  return upsertLocal(storageKeys.appointments, appointmentSeed, appointment);
}

export async function deleteAppointment(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from("appointments").delete().eq("id", id);
    if (error) throwRepositoryError("excluir o agendamento", error);
    return;
  }

  deleteLocal(storageKeys.appointments, appointmentSeed, id);
}

export type ClientBookingInput = {
  barber: EmployeeRecord;
  service: ServiceRecord;
  date: string;
  time: string;
  customerId: string;
  clientName: string;
  notes?: string;
};

export async function getAvailableSlots({
  barberId,
  serviceId,
  date,
}: {
  barberId: string;
  serviceId: string;
  date: string;
}): Promise<string[]> {
  if (supabase) {
    const { data, error } = await supabase.rpc("get_available_slots", {
      p_barber_id: barberId,
      p_service_id: serviceId,
      p_date: date,
    });
    if (error) throwRepositoryError("consultar os horários disponíveis", error);
    return (data ?? []).map((row: { slot: string }) => row.slot.slice(0, 5));
  }

  const localBarber = readLocal<EmployeeRecord>(storageKeys.employees, employeePerf).find(
    (barber) => barber.id === barberId,
  );
  const selectedService = readLocal<ServiceRecord>(storageKeys.services, serviceSeed).find(
    (service) => service.id === serviceId,
  );
  const occupied = readLocal<AppointmentRecord>(storageKeys.appointments, appointmentSeed)
    .filter(
      (appointment) =>
        appointment.appointment_date === date &&
        (appointment.barber_id === barberId || appointment.barber === localBarber?.name) &&
        !appointment.status.toLocaleLowerCase("pt-BR").startsWith("cancelado"),
    )
    .map((appointment) => ({
      time: appointment.time,
      durationMinutes: appointment.duration_minutes ?? 30,
    }));

  return filterAvailableSlots({
    candidates: buildTimeSlots("09:00", "19:00"),
    requestedDuration: selectedService?.duration ?? 30,
    closeTime: "19:00",
    occupied,
  });
}

export async function bookClientAppointment(input: ClientBookingInput): Promise<AppointmentRecord> {
  if (supabase) {
    const { data: appointmentId, error } = await supabase.rpc("book_appointment", {
      p_barber_id: input.barber.id,
      p_service_id: input.service.id,
      p_date: input.date,
      p_time: input.time,
      p_notes: input.notes ?? null,
    });
    if (error) throwRepositoryError("confirmar o agendamento", error);

    return {
      id: String(appointmentId),
      time: input.time,
      client: input.clientName,
      service: input.service.name,
      barber: input.barber.name,
      status: "Confirmado",
      price: input.service.price,
      appointment_date: input.date,
      customer_id: input.customerId,
      barber_id: input.barber.id,
      service_id: input.service.id,
      duration_minutes: input.service.duration,
      notes: input.notes,
    };
  }

  const appointment: AppointmentRecord = {
    id: crypto.randomUUID(),
    time: input.time,
    client: input.clientName,
    service: input.service.name,
    barber: input.barber.name,
    status: "Confirmado",
    price: input.service.price,
    appointment_date: input.date,
    customer_id: input.customerId,
    barber_id: input.barber.id,
    service_id: input.service.id,
    duration_minutes: input.service.duration,
    notes: input.notes,
  };
  return upsertLocal(storageKeys.appointments, appointmentSeed, appointment);
}

export async function listClientAppointments(customerId: string): Promise<AppointmentRecord[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("customer_id", customerId)
      .order("starts_at", { ascending: false });
    if (error) throwRepositoryError("carregar seu histórico", error);
    return (data ?? []).map(fromAppointmentRow);
  }

  return readLocal<AppointmentRecord>(storageKeys.appointments, appointmentSeed)
    .filter((appointment) => appointment.customer_id === customerId)
    .sort((a, b) =>
      `${b.appointment_date ?? ""} ${b.time}`.localeCompare(
        `${a.appointment_date ?? ""} ${a.time}`,
      ),
    );
}

export async function cancelClientAppointment(id: string, customerId: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.rpc("cancel_appointment", {
      p_appointment_id: id,
    });
    if (error) throwRepositoryError("cancelar o agendamento", error);
    return;
  }

  const appointments = readLocal<AppointmentRecord>(storageKeys.appointments, appointmentSeed);
  writeLocal(
    storageKeys.appointments,
    appointments.map((appointment) =>
      appointment.id === id && appointment.customer_id === customerId
        ? { ...appointment, status: "Cancelado pelo cliente" }
        : appointment,
    ),
  );
}

function readLocal<T extends { id: string }>(key: string, seed: T[]) {
  const saved = window.localStorage.getItem(key);
  if (!saved) return seed as T[];

  try {
    return JSON.parse(saved) as T[];
  } catch {
    window.localStorage.removeItem(key);
    return seed as T[];
  }
}

function writeLocal<T>(key: string, data: T[]) {
  window.localStorage.setItem(key, JSON.stringify(data));
}

function upsertLocal<T extends { id: string }>(key: string, seed: T[], item: T) {
  const list = readLocal(key, seed);
  const exists = list.some((entry) => entry.id === item.id);
  const next = exists
    ? list.map((entry) => (entry.id === item.id ? item : entry))
    : [...list, item];
  writeLocal(key, next);
  return item;
}

function deleteLocal<T extends { id: string }>(key: string, seed: T[], id: string) {
  writeLocal(
    key,
    readLocal(key, seed).filter((item) => item.id !== id),
  );
}

function fromServiceRow(row: ServiceDatabaseRow): ServiceRecord {
  return {
    id: row.id,
    name: row.name,
    duration: row.duration,
    price: row.price,
    category: row.category,
    active: row.active,
    created_at: row.created_at,
  };
}

function toServiceRow(service: ServiceRecord) {
  return {
    id: service.id,
    name: service.name,
    duration: service.duration,
    price: service.price,
    category: service.category,
    active: service.active ?? true,
  };
}

function fromProductRow(row: ProductDatabaseRow): ProductRecord {
  return {
    id: row.id,
    name: row.name,
    stock: row.stock,
    price: row.price,
    sold: row.sold,
    active: row.active,
    created_at: row.created_at,
  };
}

function toProductRow(product: ProductRecord) {
  return {
    id: product.id,
    name: product.name,
    stock: product.stock,
    price: product.price,
    sold: product.sold,
    active: product.active ?? true,
  };
}

function fromBarberRow(row: BarberDatabaseRow): EmployeeRecord {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    rating: row.rating ?? 5,
    image: row.image ?? "",
    revenue: row.revenue ?? 0,
    appts: row.appts ?? 0,
    commission: row.commission ?? 0,
    email: row.email,
    accessStatus: row.access_status,
    accessUserId: row.access_user_id,
    active: row.active,
    created_at: row.created_at,
    bio: row.bio,
    phone: row.phone,
    specialties: row.specialties ?? [],
    commissionRate: 0,
    fixedFee: row.fixed_fee ?? 0,
  };
}

function toBarberRow(employee: EmployeeRecord) {
  return {
    id: employee.id,
    name: employee.name,
    title: employee.title,
    rating: employee.rating,
    image: employee.image,
    revenue: employee.revenue,
    appts: employee.appts,
    commission: employee.commission,
    email: employee.email,
    access_status: employee.accessStatus || "local",
    access_user_id: employee.accessUserId,
    active: employee.active ?? true,
    bio: employee.bio,
    phone: employee.phone,
    specialties: employee.specialties ?? [],
    commission_rate: 0,
    fixed_fee: employee.fixedFee ?? 0,
  };
}

function toLegacyBarberRow(employee: EmployeeRecord) {
  return {
    id: employee.id,
    name: employee.name,
    title: employee.title,
    rating: employee.rating,
    image: employee.image,
    revenue: employee.revenue,
    appts: employee.appts,
    commission: 0,
    email: employee.email,
    access_status: employee.accessStatus || "local",
    access_user_id: employee.accessUserId,
    active: employee.active ?? true,
  };
}

function fromAppointmentRow(row: AppointmentDatabaseRow): AppointmentRecord {
  return {
    id: row.id,
    time: row.time,
    client: row.client_name,
    service: row.service_name,
    barber: row.barber_name,
    status: row.status,
    price: row.price,
    appointment_date: row.appointment_date,
    starts_at: row.starts_at,
    duration_minutes: row.duration_minutes,
    customer_id: row.customer_id,
    barber_id: row.barber_id,
    service_id: row.service_id,
    notes: row.notes,
    created_at: row.created_at,
  };
}

function toAppointmentRow(appointment: AppointmentRecord) {
  const appointmentDate = appointment.appointment_date || new Date().toISOString().slice(0, 10);
  return {
    id: appointment.id,
    appointment_date: appointmentDate,
    time: appointment.time,
    starts_at: appointment.starts_at || `${appointmentDate}T${appointment.time}:00-03:00`,
    duration_minutes: appointment.duration_minutes ?? 30,
    customer_id: appointment.customer_id,
    barber_id: appointment.barber_id,
    service_id: appointment.service_id,
    client_name: appointment.client,
    service_name: appointment.service,
    barber_name: appointment.barber,
    status: appointment.status,
    price: appointment.price,
    notes: appointment.notes,
  };
}

function fromBusinessSettingsRow(row: Record<string, unknown>): BusinessSettingsRecord {
  return {
    name: String(row.name ?? defaultBusinessSettings.name),
    address: String(row.address ?? ""),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    timezone: String(row.timezone ?? defaultBusinessSettings.timezone),
    weekdayStart: String(row.weekday_start ?? defaultBusinessSettings.weekdayStart).slice(0, 5),
    weekdayEnd: String(row.weekday_end ?? defaultBusinessSettings.weekdayEnd).slice(0, 5),
    saturdayStart: String(row.saturday_start ?? defaultBusinessSettings.saturdayStart).slice(0, 5),
    saturdayEnd: String(row.saturday_end ?? defaultBusinessSettings.saturdayEnd).slice(0, 5),
    sundayClosed: Boolean(row.sunday_closed ?? true),
    cancellationHours: Number(row.cancellation_hours ?? 12),
  };
}

function toBusinessSettingsRow(settings: BusinessSettingsRecord) {
  return {
    id: true,
    name: settings.name,
    address: settings.address,
    phone: settings.phone,
    email: settings.email,
    timezone: settings.timezone,
    weekday_start: settings.weekdayStart,
    weekday_end: settings.weekdayEnd,
    saturday_start: settings.saturdayStart,
    saturday_end: settings.saturdayEnd,
    sunday_closed: settings.sundayClosed,
    cancellation_hours: settings.cancellationHours,
    updated_at: new Date().toISOString(),
  };
}
