import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Package, ShoppingBag, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { listProducts, type ProductRecord } from "@/data/repositories/business-repository";
import { notifyError } from "@/shared/notifications/toast";
import { formatCurrency } from "@/shared/utils/format";

export const Route = createFileRoute("/client/products")({
  head: () => ({ meta: [{ title: "Produtos - King's Barber" }] }),
  component: ClientProductsPage,
});

function ClientProductsPage() {
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void listProducts()
      .then((rows) => {
        if (active) {
          setProducts(rows.filter((product) => product.active !== false && product.stock > 0));
        }
      })
      .catch(notifyError)
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <AppShell role="client">
      <PageHeader
        eyebrow="À venda na barbearia"
        title="Produtos"
        subtitle="Leve o cuidado da King's Barber para a sua rotina."
      />

      {loading ? (
        <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-gold" /> Carregando produtos
        </div>
      ) : products.length ? (
        <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product, index) => (
            <article
              key={product.id}
              className="glass-card group overflow-hidden rounded-2xl border border-border transition hover:-translate-y-1 hover:border-gold/40"
            >
              <div className="relative grid min-h-44 place-items-center overflow-hidden bg-accent/35">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--gold)_18%,transparent),transparent_55%)]" />
                <div className="relative grid h-24 w-24 place-items-center rounded-full border border-gold/25 bg-background/65 text-gold shadow-xl">
                  {index === 0 ? (
                    <Sparkles className="h-10 w-10" />
                  ) : index === 1 ? (
                    <Package className="h-10 w-10" />
                  ) : (
                    <ShoppingBag className="h-10 w-10" />
                  )}
                </div>
              </div>

              <div className="p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
                  Disponível na barbearia
                </p>
                <h2 className="mt-2 font-display text-2xl">{product.name}</h2>
                <div className="mt-5 flex items-end justify-between gap-4 border-t border-border pt-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Preço</p>
                    <p className="font-display text-2xl text-gold">
                      {formatCurrency(product.price)}
                    </p>
                  </div>
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                    {product.stock} disponíveis
                  </span>
                </div>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <div className="glass-card rounded-2xl p-10 text-center">
          <Package className="mx-auto h-8 w-8 text-gold" />
          <h2 className="mt-4 font-display text-2xl">Estoque em atualização</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Consulte a equipe para conhecer os produtos disponíveis hoje.
          </p>
        </div>
      )}
    </AppShell>
  );
}
