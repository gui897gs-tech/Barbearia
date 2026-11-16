import { useEffect, useState } from "react";
import { getOpenStatus, type OpenStatus } from "@/shared/brand";

export const siteNavigation = [
  { label: "Serviços", href: "#servicos", id: "servicos" },
  { label: "Trabalhos", href: "#trabalhos", id: "trabalhos" },
  { label: "Produtos", href: "#produtos", id: "produtos" },
  { label: "Contato", href: "#contato", id: "contato" },
] as const;

/** Revela uma única vez os blocos marcados com `data-reveal` quando entram na tela. */
export function useReveal(dependency: unknown = null) {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)"),
    );
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        }
      },
      { rootMargin: "0px 0px -6% 0px", threshold: 0.08 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [dependency]);
}

/** Situação de funcionamento atualizada a cada minuto (calculada só no navegador). */
export function useOpenStatus() {
  const [status, setStatus] = useState<OpenStatus | null>(null);
  useEffect(() => {
    const update = () => setStatus(getOpenStatus());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);
  return status;
}
