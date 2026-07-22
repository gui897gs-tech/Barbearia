import { createFileRoute } from "@tanstack/react-router";
import { Camera, Loader2, Mail, Phone, Save, Scissors, Star } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateBarberProfile } from "@/data/repositories/business-repository";
import { useBarberWorkspace } from "@/features/barber/use-barber-workspace";
import { notifyError, notifySuccess } from "@/shared/notifications/toast";

export const Route = createFileRoute("/barber/profile")({
  head: () => ({ meta: [{ title: "Perfil — King's Barber" }] }),
  component: BarberProfile,
});

function BarberProfile() {
  const { profile, user, loading, error, refetchProfile } = useBarberWorkspace();
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [specialties, setSpecialties] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (error) notifyError(error);
  }, [error]);

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setTitle(profile.title);
    setImage(profile.image ?? "");
    setPhone(profile.phone ?? "");
    setBio(profile.bio ?? "");
    setSpecialties((profile.specialties ?? []).join(", "));
  }, [profile]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      await updateBarberProfile(profile, {
        name: name.trim(),
        title: title.trim(),
        image: image.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        specialties: specialties
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 10),
      });
      await refetchProfile();
      notifySuccess("Perfil profissional atualizado.");
    } catch (caughtError) {
      notifyError(caughtError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell role="barber">
      <PageHeader
        eyebrow="Sua assinatura"
        title="Perfil profissional"
        subtitle="Estas informações ajudam a apresentar seu trabalho aos clientes."
      />

      {loading ? (
        <div className="flex min-h-56 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-gold" /> Carregando perfil
        </div>
      ) : profile ? (
        <form onSubmit={handleSubmit} className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <aside className="glass-card h-fit rounded-2xl p-6 text-center xl:sticky xl:top-24">
            <div className="relative mx-auto h-32 w-32">
              {image ? (
                <img
                  src={image}
                  alt={`Foto profissional de ${name || profile.name}`}
                  className="h-full w-full rounded-full border border-gold/40 object-cover p-1"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full border border-gold/40 bg-muted font-display text-4xl text-gold">
                  {(name || profile.name).slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="absolute bottom-1 right-1 rounded-full border border-border bg-background p-2 text-gold">
                <Camera className="h-4 w-4" />
              </div>
            </div>
            <h2 className="mt-4 font-display text-2xl">{name || profile.name}</h2>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-gold">
              {title || profile.title}
            </p>
            <div className="mt-5 flex items-center justify-center gap-1 text-gold">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-semibold">{profile.rating}</span>
              <span className="text-xs text-muted-foreground">avaliação atual</span>
            </div>
            <div className="mt-6 space-y-3 border-t border-border pt-5 text-left text-sm text-muted-foreground">
              <div className="flex items-center gap-2 break-all">
                <Mail className="h-4 w-4 shrink-0 text-gold" />{" "}
                {user?.email ?? profile.email ?? "E-mail não informado"}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-gold" /> {phone || "Telefone não informado"}
              </div>
            </div>
          </aside>

          <section className="glass-card rounded-2xl p-5 sm:p-7">
            <div className="mb-6 flex items-center gap-3 border-b border-border pb-5">
              <Scissors className="h-5 w-5 text-gold" />
              <div>
                <h2 className="font-display text-xl">Cartão profissional</h2>
                <p className="text-xs text-muted-foreground">Mantenha os dados claros e atuais.</p>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nome profissional" htmlFor="barber-name">
                <Input
                  id="barber-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  minLength={3}
                  required
                />
              </Field>
              <Field label="Título" htmlFor="barber-title">
                <Input
                  id="barber-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  minLength={2}
                  required
                />
              </Field>
              <Field label="Telefone" htmlFor="barber-phone">
                <Input
                  id="barber-phone"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  maxLength={30}
                  placeholder="(11) 99999-9999"
                />
              </Field>
              <Field label="URL da foto" htmlFor="barber-image">
                <Input
                  id="barber-image"
                  type="url"
                  value={image}
                  onChange={(event) => setImage(event.target.value)}
                  placeholder="https://..."
                />
              </Field>
              <Field
                label="Especialidades"
                htmlFor="barber-specialties"
                className="sm:col-span-2"
                hint="Separe por vírgulas; no máximo 10."
              >
                <Input
                  id="barber-specialties"
                  value={specialties}
                  onChange={(event) => setSpecialties(event.target.value)}
                  placeholder="Fade, tesoura, barba clássica"
                />
              </Field>
              <Field
                label="Apresentação"
                htmlFor="barber-bio"
                className="sm:col-span-2"
                hint={`${bio.length}/600 caracteres`}
              >
                <Textarea
                  id="barber-bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  maxLength={600}
                  rows={6}
                  placeholder="Conte brevemente sua experiência e seu estilo de trabalho."
                />
              </Field>
            </div>

            <div className="mt-7 flex justify-end border-t border-border pt-5">
              <Button
                type="submit"
                disabled={saving || name.trim().length < 3 || title.trim().length < 2}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Salvando" : "Salvar perfil"}
              </Button>
            </div>
          </section>
        </form>
      ) : (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
          Seu usuário ainda não está vinculado a um perfil profissional.
        </div>
      )}
    </AppShell>
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
      <div className="mb-2 flex items-end justify-between gap-3">
        <Label htmlFor={htmlFor}>{label}</Label>
        {hint ? <span className="text-[10px] text-muted-foreground">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
