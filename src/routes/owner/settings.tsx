import { createFileRoute } from "@tanstack/react-router";
import { Building2, Clock3, Loader2, Save, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  BusinessSettingsRecord,
  getBusinessSettings,
  saveBusinessSettings,
} from "@/data/repositories/business-repository";
import { notifyError, notifySuccess } from "@/shared/notifications/toast";

export const Route = createFileRoute("/owner/settings")({
  head: () => ({ meta: [{ title: "Configurações — King's Barber" }] }),
  component: OwnerSettings,
});

function OwnerSettings() {
  const [settings, setSettings] = useState<BusinessSettingsRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void getBusinessSettings()
      .then(setSettings)
      .catch(notifyError)
      .finally(() => setLoading(false));
  }, []);

  function update<Key extends keyof BusinessSettingsRecord>(
    key: Key,
    value: BusinessSettingsRecord[Key],
  ) {
    setSettings((current) => (current ? { ...current, [key]: value } : current));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    if (
      settings.weekdayStart >= settings.weekdayEnd ||
      settings.saturdayStart >= settings.saturdayEnd
    ) {
      notifyError("O horário de fechamento deve ser posterior ao de abertura.");
      return;
    }
    setSaving(true);
    try {
      const saved = await saveBusinessSettings(settings);
      setSettings(saved);
      notifySuccess("Configurações atualizadas.");
    } catch (error) {
      notifyError(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell role="owner">
      <PageHeader
        eyebrow="Operação da casa"
        title="Configurações"
        subtitle="Dados públicos, horários e regras usadas no agendamento online."
      />

      {loading ? (
        <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-gold" /> Carregando configurações
        </div>
      ) : settings ? (
        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="glass-card rounded-2xl p-5 sm:p-7">
            <SectionHeading
              icon={Building2}
              title="Dados da barbearia"
              description="Informações de contato apresentadas aos clientes."
            />
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nome da barbearia" htmlFor="business-name" className="sm:col-span-2">
                <Input
                  id="business-name"
                  value={settings.name}
                  onChange={(event) => update("name", event.target.value)}
                  required
                  minLength={3}
                />
              </Field>
              <Field label="Telefone" htmlFor="business-phone">
                <Input
                  id="business-phone"
                  type="tel"
                  value={settings.phone}
                  onChange={(event) => update("phone", event.target.value)}
                  maxLength={30}
                />
              </Field>
              <Field label="E-mail" htmlFor="business-email">
                <Input
                  id="business-email"
                  type="email"
                  value={settings.email}
                  onChange={(event) => update("email", event.target.value)}
                />
              </Field>
              <Field label="Endereço" htmlFor="business-address" className="sm:col-span-2">
                <Input
                  id="business-address"
                  value={settings.address}
                  onChange={(event) => update("address", event.target.value)}
                  maxLength={240}
                />
              </Field>
            </div>
          </section>

          <section className="glass-card rounded-2xl p-5 sm:p-7">
            <SectionHeading
              icon={Clock3}
              title="Agenda online"
              description="Esses limites controlam os horários exibidos ao cliente."
            />
            <div className="space-y-5">
              <TimeRange
                label="Segunda a sexta"
                start={settings.weekdayStart}
                end={settings.weekdayEnd}
                onStart={(value) => update("weekdayStart", value)}
                onEnd={(value) => update("weekdayEnd", value)}
              />
              <TimeRange
                label="Sábado"
                start={settings.saturdayStart}
                end={settings.saturdayEnd}
                onStart={(value) => update("saturdayStart", value)}
                onEnd={(value) => update("saturdayEnd", value)}
              />
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
                <div>
                  <Label htmlFor="sunday-closed">Domingo fechado</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Quando ativo, nenhum horário é oferecido.
                  </p>
                </div>
                <Switch
                  id="sunday-closed"
                  checked={settings.sundayClosed}
                  onCheckedChange={(checked) => update("sundayClosed", checked)}
                />
              </div>
              <Field
                label="Antecedência para cancelamento"
                htmlFor="cancellation-hours"
                hint="Em horas"
              >
                <Input
                  id="cancellation-hours"
                  type="number"
                  min={0}
                  max={168}
                  value={settings.cancellationHours}
                  onChange={(event) => update("cancellationHours", Number(event.target.value))}
                />
              </Field>
              <div className="flex gap-3 rounded-xl border border-gold/25 bg-gold/5 p-4 text-xs leading-relaxed text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                Alterações são protegidas pelas permissões de proprietário e aplicadas aos novos
                agendamentos.
              </div>
            </div>
          </section>

          <div className="xl:col-span-2 flex justify-end">
            <Button type="submit" size="lg" disabled={saving || settings.name.trim().length < 3}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Salvando" : "Salvar alterações"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
          Não foi possível carregar as configurações.
        </div>
      )}
    </AppShell>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Building2;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-6 flex items-start gap-3 border-b border-border pb-5">
      <div className="rounded-xl bg-accent p-2.5 text-gold">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h2 className="font-display text-xl">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-2 flex justify-between gap-2">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint ? <span className="text-[10px] text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function TimeRange({
  label,
  start,
  end,
  onStart,
  onEnd,
}: {
  label: string;
  start: string;
  end: string;
  onStart: (value: string) => void;
  onEnd: (value: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <Input
          aria-label={`${label}: abertura`}
          type="time"
          value={start}
          onChange={(event) => onStart(event.target.value)}
        />
        <span className="text-xs text-muted-foreground">até</span>
        <Input
          aria-label={`${label}: fechamento`}
          type="time"
          value={end}
          onChange={(event) => onEnd(event.target.value)}
        />
      </div>
    </div>
  );
}
