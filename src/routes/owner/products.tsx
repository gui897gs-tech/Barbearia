import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { AppShell, PageHeader, StatCard } from "@/components/AppShell";
import { fmtBRL } from "@/lib/sample-data";
import { deleteProduct, listProducts, ProductRecord, saveProduct } from "@/lib/business-data";
import { Package, Plus, AlertTriangle, Trash2, X } from "lucide-react";

type Product = ProductRecord;

export const Route = createFileRoute("/owner/products")({
  head: () => ({ meta: [{ title: "Produtos - Maison Lame" }] }),
  component: ProductsPage,
});

function ProductsPage() {
  const [productList, setProductList] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);

  useEffect(() => {
    listProducts().then(setProductList);
  }, []);

  const stats = useMemo(() => {
    const totalSales = productList.reduce((sum, product) => sum + product.price * product.sold, 0);
    const lowStock = productList.filter((product) => product.stock < 10).length;
    const bestSeller = productList.reduce((best, product) => (product.sold > best.sold ? product : best), productList[0]);

    return { totalSales, lowStock, bestSeller };
  }, [productList]);

  async function handleSave(product: Product) {
    const saved = await saveProduct(product);
    setProductList(productList.map((item) => (item.id === saved.id ? saved : item)));
    setEditingProduct(null);
  }

  async function handleCreate(product: Product) {
    const saved = await saveProduct(product);
    setProductList([...productList, saved]);
    setAddingProduct(false);
  }

  async function handleDelete(product: Product) {
    await deleteProduct(product.id);
    setProductList(productList.filter((item) => item.id !== product.id));
    if (editingProduct?.id === product.id) {
      setEditingProduct(null);
    }
  }

  return (
    <AppShell role="owner">
      <PageHeader
        eyebrow="Boutique"
        title="Produtos"
        subtitle="A prateleira: essenciais de grooming que seus clientes levam pra casa."
        action={
          <button
            type="button"
            onClick={() => setAddingProduct(true)}
            className="inline-flex items-center gap-2 rounded-xl gradient-gold px-4 py-2.5 text-sm font-medium text-primary-foreground gold-glow"
          >
            <Plus className="h-4 w-4" /> Adicionar produto
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Produtos" value={String(productList.length)} icon={Package} />
        <StatCard label="Vendas no mes" value={fmtBRL(stats.totalSales)} delta="+18%" />
        <StatCard label="Estoque baixo" value={`${stats.lowStock} itens`} delta="Repor em breve" icon={AlertTriangle} />
        <StatCard label="Mais vendido" value={stats.bestSeller?.name || "-"} />
      </div>

      <div className="glass-card rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
            <tr>
              <th className="px-6 py-4">Produto</th>
              <th className="px-6 py-4">Preco</th>
              <th className="px-6 py-4">Estoque</th>
              <th className="px-6 py-4">Vendidos</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody>
            {productList.map((product) => (
              <tr key={product.id} className="border-b border-border/40 hover:bg-accent/30 transition">
                <td className="px-6 py-4 font-medium">{product.name}</td>
                <td className="px-6 py-4 text-gold">{fmtBRL(product.price)}</td>
                <td className="px-6 py-4">
                  <span className={`${product.stock < 10 ? "text-destructive" : ""}`}>{product.stock}</span>
                </td>
                <td className="px-6 py-4">{product.sold}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setEditingProduct(product)} className="text-xs text-gold hover:text-gold-hover transition">
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(product)}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Excluir
                  </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingProduct && (
        <ProductDialog
          title="Editar produto"
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSave}
        />
      )}

      {addingProduct && (
        <ProductDialog
          title="Adicionar produto"
          product={{ id: `p-${Date.now()}`, name: "", stock: 0, price: 0, sold: 0 }}
          onClose={() => setAddingProduct(false)}
          onSave={handleCreate}
        />
      )}
    </AppShell>
  );
}

function ProductDialog({
  title,
  product,
  onClose,
  onSave,
}: {
  title: string;
  product: Product;
  onClose: () => void;
  onSave: (product: Product) => void;
}) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [sold, setSold] = useState(String(product.sold));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSave({
      ...product,
      name: name.trim(),
      price: Number(price),
      stock: Number(stock),
      sold: Number(sold),
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-gold">{title}</div>
            <h2 className="font-display mt-1 text-2xl">Dados do produto</h2>
          </div>
          <button type="button" onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg border border-border text-muted-foreground hover:text-foreground transition" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <Field label="Nome do produto" value={name} onChange={setName} required />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Preco" value={price} onChange={setPrice} type="number" min="0" required />
            <Field label="Estoque" value={stock} onChange={setStock} type="number" min="0" required />
            <Field label="Vendidos" value={sold} onChange={setSold} type="number" min="0" required />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-xl border border-border px-4 py-3 text-sm text-muted-foreground hover:text-foreground transition">
            Cancelar
          </button>
          <button type="submit" className="flex-1 rounded-xl gradient-gold px-4 py-3 text-sm font-medium text-primary-foreground gold-glow">
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  min,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  min?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        required={required}
        type={type}
        min={min}
        step="1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl bg-background border border-border px-4 py-3 text-sm focus:outline-none focus:border-[color:var(--gold)] transition"
      />
    </label>
  );
}
