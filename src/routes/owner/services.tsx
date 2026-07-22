import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { formatCurrency } from "@/shared/utils/format";
import {
  deleteService,
  listServices,
  saveService,
  ServiceRecord,
} from "@/data/repositories/business-repository";
import { Clock, Plus, Pencil, X } from "lucide-react";
import { notifyError, notifySuccess } from "@/shared/notifications/toast";

type Service = ServiceRecord;

export const Route = createFileRoute("/owner/services")({
  head: () => ({ meta: [{ title: "Servicos - King's Barber" }] }),
  component: ServicesPage,
});

function ServicesPage() {
  const [serviceList, setServiceList] = useState<Service[]>([]);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [addingService, setAddingService] = useState(false);

  useEffect(() => {
    void listServices().then(setServiceList).catch(notifyError);
  }, []);

  async function handleSave(updatedService: Service) {
    try {
      const saved = await saveService(updatedService);
      setServiceList((items) =>
        items.map((service) => (service.id === saved.id ? saved : service)),
      );
      setEditingService(null);
      notifySuccess("Serviço atualizado.");
    } catch (error) {
      notifyError(error);
    }
  }

  async function handleCreate(newService: Service) {
    try {
      const saved = await saveService(newService);
      setServiceList((items) => [...items, saved]);
      setAddingService(false);
      notifySuccess("Serviço adicionado.");
    } catch (error) {
      notifyError(error);
    }
  }

  async function handleDelete(service: Service) {
    try {
      await deleteService(service.id);
      setServiceList((items) => items.filter((item) => item.id !== service.id));
      notifySuccess("Serviço excluído.");
    } catch (error) {
      notifyError(error);
    }
  }

  return (
    <AppShell role="owner">
      <PageHeader
        eyebrow="Cardapio"
        title="Servicos"
        subtitle="Todos os rituais oferecidos na cadeira."
        action={
          <button
            type="button"
            onClick={() => setAddingService(true)}
            className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2.5 text-sm font-medium text-primary-foreground gold-glow"
          >
            <Plus className="h-4 w-4" /> Adicionar serviço
          </button>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {serviceList.map((service) => (
          <div
            key={service.id}
            className="glass-card rounded-2xl p-6 hover:gold-glow transition group"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-gold">
                  {service.category}
                </div>
                <div className="font-display text-xl mt-2">{service.name}</div>
              </div>
              <button
                type="button"
                aria-label={`Editar ${service.name}`}
                onClick={() => setEditingService(service)}
                className="grid h-9 w-9 place-items-center rounded-lg border border-border opacity-100 md:opacity-0 group-hover:opacity-100 hover:border-[color:var(--gold)]/60 hover:text-gold transition"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-6 flex items-end justify-between">
              <div>
                <div className="text-3xl font-display text-gradient-gold">
                  {formatCurrency(service.price)}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {service.duration} min
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(service)}
                className="ml-2 rounded-xl border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive transition"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingService && (
        <EditServiceDialog
          title="Editar serviço"
          service={editingService}
          onClose={() => setEditingService(null)}
          onSave={handleSave}
        />
      )}

      {addingService && (
        <EditServiceDialog
          title="Adicionar serviço"
          service={{
            id: `s-${Date.now()}`,
            name: "",
            price: 0,
            duration: 30,
            category: "Cabelo",
          }}
          onClose={() => setAddingService(false)}
          onSave={handleCreate}
        />
      )}
    </AppShell>
  );
}

function EditServiceDialog({
  title,
  service,
  onClose,
  onSave,
}: {
  title: string;
  service: Service;
  onClose: () => void;
  onSave: (service: Service) => void;
}) {
  const [name, setName] = useState(service.name);
  const [category, setCategory] = useState(service.category);
  const [price, setPrice] = useState(String(service.price));
  const [duration, setDuration] = useState(String(service.duration));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSave({
      ...service,
      name: name.trim(),
      category: category.trim(),
      price: Number(price),
      duration: Number(duration),
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-gold">{title}</div>
            <h2 className="font-display mt-1 text-2xl">Nome e valor</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs text-muted-foreground">Nome do serviço</span>
            <input
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
            />
          </label>

          <label className="block">
            <span className="text-xs text-muted-foreground">Valor</span>
            <input
              required
              type="number"
              min="0"
              step="1"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="mt-1 w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
            />
          </label>

          <label className="block">
            <span className="text-xs text-muted-foreground">Duracao em minutos</span>
            <input
              required
              type="number"
              min="1"
              step="1"
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
              className="mt-1 w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
            />
          </label>

          <label className="block">
            <span className="text-xs text-muted-foreground">Categoria</span>
            <input
              required
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-1 w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
            />
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl gradient-gold px-4 py-3 text-sm font-medium text-primary-foreground gold-glow"
          >
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}
