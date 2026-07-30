import { toast } from "sonner";
import { RepositoryError } from "@/data/repositories/repository-error";

export function notifyError(error: unknown, fallback = "Não foi possível concluir a operação.") {
  const message = error instanceof Error && error.message ? error.message : fallback;
  const cause =
    error instanceof RepositoryError &&
    error.cause &&
    typeof error.cause === "object" &&
    "message" in error.cause
      ? String(error.cause.message)
      : "";
  toast.error(message, {
    description: cause || "Verifique sua conexão e tente novamente.",
  });
}

export function notifySuccess(message: string) {
  toast.success(message);
}
