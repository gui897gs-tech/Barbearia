export type ToastTone = "success" | "error" | "info";

export type ToastItem = {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
  duration: number;
};

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener(toasts);
}

export function subscribeToasts(listener: Listener) {
  listeners.add(listener);
  listener(toasts);
  return () => {
    listeners.delete(listener);
  };
}

export function pushToast(input: Omit<ToastItem, "id" | "duration"> & { duration?: number }) {
  const item: ToastItem = { id: nextId++, duration: input.duration ?? 4500, ...input };
  toasts = [...toasts.slice(-3), item];
  emit();
  return item.id;
}

export function dismissToast(id: number) {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}
