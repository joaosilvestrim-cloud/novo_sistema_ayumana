// Horário de atendimento + fuso horário (com de/para para o horário de Brasília).

export const BR_TZ = "America/Sao_Paulo";

export type DayKey = "seg" | "ter" | "qua" | "qui" | "sex" | "sab" | "dom";
export type DayHours = { open: string; close: string } | null;
export type Schedule = Record<DayKey, DayHours>;

export const DAY_ORDER: DayKey[] = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"];

export const DAY_LABEL: Record<DayKey, string> = {
  seg: "Segunda-feira",
  ter: "Terça-feira",
  qua: "Quarta-feira",
  qui: "Quinta-feira",
  sex: "Sexta-feira",
  sab: "Sábado",
  dom: "Domingo",
};

export const TIMEZONES: { value: string; label: string; group: "Brasil" | "Exterior" }[] = [
  { value: "America/Sao_Paulo", label: "Brasília (GMT-3)", group: "Brasil" },
  { value: "America/Manaus", label: "Manaus (GMT-4)", group: "Brasil" },
  { value: "America/Rio_Branco", label: "Rio Branco (GMT-5)", group: "Brasil" },
  { value: "America/Noronha", label: "Fernando de Noronha (GMT-2)", group: "Brasil" },
  { value: "Europe/Lisbon", label: "Portugal — Lisboa", group: "Exterior" },
  { value: "Europe/Dublin", label: "Irlanda — Dublin", group: "Exterior" },
  { value: "Europe/London", label: "Reino Unido — Londres", group: "Exterior" },
  { value: "Europe/Madrid", label: "Espanha — Madri", group: "Exterior" },
  { value: "Europe/Berlin", label: "Alemanha — Berlim", group: "Exterior" },
  { value: "Europe/Amsterdam", label: "Holanda — Amsterdã", group: "Exterior" },
  { value: "America/New_York", label: "EUA — Nova York (Leste)", group: "Exterior" },
  { value: "America/Chicago", label: "EUA — Chicago (Central)", group: "Exterior" },
  { value: "America/Los_Angeles", label: "EUA — Los Angeles (Pacífico)", group: "Exterior" },
  { value: "America/Toronto", label: "Canadá — Toronto", group: "Exterior" },
  { value: "Australia/Sydney", label: "Austrália — Sydney", group: "Exterior" },
  { value: "Asia/Tokyo", label: "Japão — Tóquio", group: "Exterior" },
];

export function tzLabel(value: string | null | undefined): string {
  return TIMEZONES.find((t) => t.value === value)?.label ?? (value ?? "Brasília (GMT-3)");
}

/** Offset do fuso em minutos (em relação ao UTC) para um instante. */
function offsetMinutes(tz: string, at: Date): number {
  const utc = new Date(at.toLocaleString("en-US", { timeZone: "UTC" }));
  const local = new Date(at.toLocaleString("en-US", { timeZone: tz }));
  return Math.round((local.getTime() - utc.getTime()) / 60000);
}

/** Diferença (em minutos) entre dois fusos, agora. */
export function tzDiffMinutes(fromTz: string, toTz: string, at: Date = new Date()): number {
  return offsetMinutes(toTz, at) - offsetMinutes(fromTz, at);
}

/** Converte "HH:MM" do fuso de origem para o fuso de destino. */
export function convertHHMM(hhmm: string, fromTz: string, toTz: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!m) return hhmm;
  const total = (Number(m[1]) * 60 + Number(m[2]) + tzDiffMinutes(fromTz, toTz) + 1440 * 2) % 1440;
  const h = String(Math.floor(total / 60)).padStart(2, "0");
  const mm = String(total % 60).padStart(2, "0");
  return `${h}:${mm}`;
}

/** True se o fuso é diferente do horário de Brasília. */
export function isForeignTz(tz: string | null | undefined): boolean {
  return !!tz && tz !== BR_TZ;
}

export function emptySchedule(): Schedule {
  return { seg: null, ter: null, qua: null, qui: null, sex: null, sab: null, dom: null };
}
