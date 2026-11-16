import { RepositoryError } from "@/data/repositories/repository-error";
import { pushToast } from "@/shared/notifications/toast-store";

export function notifyError(error: unknown, fallback = "Não foi possível concluir a operação.") {
  const message = error instanceof Error && error.message ? error.message : fallback;
  const cause =
    error instanceof RepositoryError &&
    error.cause &&
    typeof error.cause === "object" &&
    "message" in error.cause
      ? String(error.cause.message)
      : "";
  pushToast({
    tone: "error",
    title: message,
    description: cause || "Verifique sua conexão e tente novamente.",
    duration: 6500,
  });
}

export function notifySuccess(message: string) {
  pushToast({ tone: "success", title: message });
}

export function notifyInfo(message: string, description?: string) {
  pushToast({ tone: "info", title: message, description });
}
