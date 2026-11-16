/**
 * Fonte única da identidade e dos canais de contato da King's Barber.
 *
 * Alterar um dado aqui atualiza o site público, o agendamento, o login,
 * os rodapés e os botões flutuantes de contato ao mesmo tempo.
 *
 * O número de WhatsApp pode ser sobrescrito no deploy pela variável
 * `VITE_WHATSAPP_NUMBER` (somente dígitos, com DDI 55 + DDD).
 */

const envWhatsApp =
  typeof import.meta !== "undefined" ? String(import.meta.env?.VITE_WHATSAPP_NUMBER ?? "") : "";

const whatsappDigits = (envWhatsApp || "5511999999999").replace(/\D/g, "");

export const brand = {
  name: "King's Barber",
  slogan: "Aqui todo cliente é rei.",
  tagline: "Tradição • Estilo • Excelência",
  address: {
    street: "Rua Nelson Mandela, 119",
    full: "Rua Nelson Mandela, 119",
  },
  instagram: {
    handle: "@kiingsbarberr",
    url: "https://www.instagram.com/kiingsbarberr/",
  },
  whatsapp: {
    digits: whatsappDigits,
    display: formatWhatsAppDisplay(whatsappDigits),
  },
  timezone: "America/Sao_Paulo",
  hours: [
    { label: "Segunda a sexta", value: "09h às 19h" },
    { label: "Sábado", value: "09h às 19h" },
    { label: "Domingo", value: "Fechado" },
  ],
  /** Expediente por dia da semana (0 = domingo). `null` = fechado. */
  schedule: {
    0: null,
    1: { open: "09:00", close: "19:00" },
    2: { open: "09:00", close: "19:00" },
    3: { open: "09:00", close: "19:00" },
    4: { open: "09:00", close: "19:00" },
    5: { open: "09:00", close: "19:00" },
    6: { open: "09:00", close: "19:00" },
  } as Record<number, { open: string; close: string } | null>,
} as const;

const weekdayNames = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export type OpenStatus = {
  open: boolean;
  label: string;
  detail: string;
  weekday: number;
};

/** Situação da barbearia agora, calculada no fuso da casa. */
export function getOpenStatus(now = new Date()): OpenStatus {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: brand.timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    parts.find((part) => part.type === "weekday")?.value ?? "Sun",
  );
  const minutes =
    Number(parts.find((part) => part.type === "hour")?.value ?? 0) * 60 +
    Number(parts.find((part) => part.type === "minute")?.value ?? 0);
  const today = brand.schedule[weekdayIndex];
  const toMinutes = (value: string) => {
    const [hours, mins] = value.split(":").map(Number);
    return hours * 60 + mins;
  };
  const pretty = (value: string) => value.replace(":00", "h").replace(":", "h");

  if (today && minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) {
    return {
      open: true,
      label: "Aberto agora",
      detail: `Fecha às ${pretty(today.close)}`,
      weekday: weekdayIndex,
    };
  }

  if (today && minutes < toMinutes(today.open)) {
    return {
      open: false,
      label: "Fechado agora",
      detail: `Abre hoje às ${pretty(today.open)}`,
      weekday: weekdayIndex,
    };
  }

  for (let offset = 1; offset <= 7; offset += 1) {
    const day = (weekdayIndex + offset) % 7;
    const schedule = brand.schedule[day];
    if (schedule) {
      return {
        open: false,
        label: "Fechado agora",
        detail: `Abre ${offset === 1 ? "amanhã" : weekdayNames[day]} às ${pretty(schedule.open)}`,
        weekday: weekdayIndex,
      };
    }
  }

  return { open: false, label: "Fechado", detail: "Consulte pelo WhatsApp", weekday: weekdayIndex };
}

export const mapsSearchUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${brand.name}, ${brand.address.full}`,
)}`;

export function whatsappUrl(message = "Olá, King's Barber! Gostaria de agendar um horário.") {
  return `https://wa.me/${brand.whatsapp.digits}?text=${encodeURIComponent(message)}`;
}

function formatWhatsAppDisplay(digits: string) {
  const local = digits.startsWith("55") ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return `+${digits}`;
}
