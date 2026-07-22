import { toast } from "sonner";

export function notifyError(error: unknown, fallback = "Não foi possível concluir a operação.") {
  const message = error instanceof Error && error.message ? error.message : fallback;
  toast.error(message, {
    description: "Verifique sua conexão e tente novamente.",
  });
}

export function notifySuccess(message: string) {
  toast.success(message);
}
