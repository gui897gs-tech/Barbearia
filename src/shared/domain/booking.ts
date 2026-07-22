export type OccupiedInterval = {
  time: string;
  durationMinutes: number;
};

export function buildTimeSlots(openTime: string, closeTime: string, stepMinutes = 30) {
  const open = timeToMinutes(openTime);
  const close = timeToMinutes(closeTime);
  if (open >= close || stepMinutes < 5) return [];

  const slots: string[] = [];
  for (let minute = open; minute < close; minute += stepMinutes) {
    slots.push(minutesToTime(minute));
  }
  return slots;
}

export function filterAvailableSlots({
  candidates,
  requestedDuration,
  closeTime,
  occupied,
}: {
  candidates: string[];
  requestedDuration: number;
  closeTime: string;
  occupied: OccupiedInterval[];
}) {
  const close = timeToMinutes(closeTime);
  return candidates.filter((candidate) => {
    const candidateStart = timeToMinutes(candidate);
    const candidateEnd = candidateStart + requestedDuration;
    if (candidateEnd > close) return false;

    return occupied.every((interval) => {
      const occupiedStart = timeToMinutes(interval.time);
      const occupiedEnd = occupiedStart + interval.durationMinutes;
      return candidateEnd <= occupiedStart || candidateStart >= occupiedEnd;
    });
  });
}

export function timeToMinutes(time: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) throw new Error(`Horário inválido: ${time}`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error(`Horário inválido: ${time}`);
  return hours * 60 + minutes;
}

function minutesToTime(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}
