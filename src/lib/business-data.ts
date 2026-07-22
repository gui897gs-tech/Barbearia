import { appointments as appointmentSeed, employeePerf, products as productSeed, services as serviceSeed } from "@/lib/sample-data";
import { supabase } from "@/lib/supabase";

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
};

export type AppointmentRecord = (typeof appointmentSeed)[number] & {
  appointment_date?: string;
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
};

export async function listServices() {
  if (supabase) {
    const { data, error } = await supabase.from("services").select("*").order("name");
    if (!error && data?.length) return data.map(fromServiceRow);
    if (!error && data && data.length === 0) return seedRemoteServices();
  }

  return readLocal<ServiceRecord>(storageKeys.services, serviceSeed);
}

export async function saveService(service: ServiceRecord) {
  if (supabase) {
    const payload = toServiceRow(service);
    const { data, error } = await supabase.from("services").upsert(payload).select("*").single();
    if (!error && data) return fromServiceRow(data);
  }

  return upsertLocal(storageKeys.services, serviceSeed, service);
}

export async function deleteService(id: string) {
  if (supabase) {
    const { error } = await supabase.from("services").delete().eq("id", id);
    if (!error) return;
  }

  deleteLocal(storageKeys.services, serviceSeed, id);
}

export async function listProducts() {
  if (supabase) {
    const { data, error } = await supabase.from("products").select("*").order("name");
    if (!error && data?.length) return data.map(fromProductRow);
    if (!error && data && data.length === 0) return seedRemoteProducts();
  }

  return readLocal<ProductRecord>(storageKeys.products, productSeed);
}

export async function saveProduct(product: ProductRecord) {
  if (supabase) {
    const payload = toProductRow(product);
    const { data, error } = await supabase.from("products").upsert(payload).select("*").single();
    if (!error && data) return fromProductRow(data);
  }

  return upsertLocal(storageKeys.products, productSeed, product);
}

export async function deleteProduct(id: string) {
  if (supabase) {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (!error) return;
  }

  deleteLocal(storageKeys.products, productSeed, id);
}

export async function listEmployees() {
  if (supabase) {
    const { data, error } = await supabase.from("barbers").select("*").order("name");
    if (!error && data?.length) return data.map(fromBarberRow);
    if (!error && data && data.length === 0) return seedRemoteEmployees();
  }

  return readLocal<EmployeeRecord>(storageKeys.employees, employeePerf);
}

export async function saveEmployee(employee: EmployeeRecord) {
  if (supabase) {
    const payload = toBarberRow(employee);
    const { data, error } = await supabase.from("barbers").upsert(payload).select("*").single();
    if (!error && data) return fromBarberRow(data);
  }

  return upsertLocal(storageKeys.employees, employeePerf, employee);
}

export async function deleteEmployee(id: string) {
  if (supabase) {
    const { error } = await supabase.from("barbers").delete().eq("id", id);
    if (!error) return;
  }

  deleteLocal(storageKeys.employees, employeePerf, id);
}

export async function listAppointments(date?: string) {
  if (supabase) {
    let query = supabase.from("appointments").select("*").order("time");
    if (date) query = query.eq("appointment_date", date);
    const { data, error } = await query;
    if (!error && data) return data.map(fromAppointmentRow);
  }

  return readLocal<AppointmentRecord>(storageKeys.appointments, appointmentSeed);
}

export async function saveAppointment(appointment: AppointmentRecord) {
  if (supabase) {
    const payload = toAppointmentRow(appointment);
    const { data, error } = await supabase.from("appointments").upsert(payload).select("*").single();
    if (!error && data) return fromAppointmentRow(data);
  }

  return upsertLocal(storageKeys.appointments, appointmentSeed, appointment);
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
  const next = exists ? list.map((entry) => (entry.id === item.id ? item : entry)) : [...list, item];
  writeLocal(key, next);
  return item;
}

function deleteLocal<T extends { id: string }>(key: string, seed: T[], id: string) {
  writeLocal(
    key,
    readLocal(key, seed).filter((item) => item.id !== id),
  );
}

function fromServiceRow(row: any): ServiceRecord {
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

function fromProductRow(row: any): ProductRecord {
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

function fromBarberRow(row: any): EmployeeRecord {
  return {
    id: row.id,
    name: row.name,
    title: row.title,
    rating: row.rating,
    image: row.image,
    revenue: row.revenue,
    appts: row.appts,
    commission: row.commission,
    email: row.email,
    accessStatus: row.access_status,
    accessUserId: row.access_user_id,
    active: row.active,
    created_at: row.created_at,
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
  };
}

function fromAppointmentRow(row: any): AppointmentRecord {
  return {
    id: row.id,
    time: row.time,
    client: row.client_name,
    service: row.service_name,
    barber: row.barber_name,
    status: row.status,
    price: row.price,
    appointment_date: row.appointment_date,
    customer_id: row.customer_id,
    barber_id: row.barber_id,
    service_id: row.service_id,
    notes: row.notes,
    created_at: row.created_at,
  };
}

function toAppointmentRow(appointment: AppointmentRecord) {
  return {
    id: appointment.id,
    appointment_date: appointment.appointment_date || new Date().toISOString().slice(0, 10),
    time: appointment.time,
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

async function seedRemoteServices() {
  if (!supabase) return serviceSeed;

  const payload = serviceSeed.map(toServiceRow);
  const { data, error } = await supabase.from("services").upsert(payload).select("*").order("name");
  return !error && data ? data.map(fromServiceRow) : serviceSeed;
}

async function seedRemoteProducts() {
  if (!supabase) return productSeed;

  const payload = productSeed.map(toProductRow);
  const { data, error } = await supabase.from("products").upsert(payload).select("*").order("name");
  return !error && data ? data.map(fromProductRow) : productSeed;
}

async function seedRemoteEmployees() {
  if (!supabase) return employeePerf;

  const payload = employeePerf.map((employee) =>
    toBarberRow({
      ...employee,
      accessStatus: "local",
      active: true,
    }),
  );
  const { data, error } = await supabase.from("barbers").upsert(payload).select("*").order("name");
  return !error && data ? data.map(fromBarberRow) : employeePerf;
}
