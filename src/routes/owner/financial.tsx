import { createFileRoute } from "@tanstack/react-router";
import { endOfMonth, format, isWithinInterval, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, Download, Loader2, Package, ReceiptText, Wallet } from "lucide-react";
import { useEffect } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell, PageHeader, StatCard } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { AppointmentRecord, EmployeeRecord } from "@/data/repositories/business-repository";
import { useOwnerData } from "@/features/owner/use-owner-data";
import { downloadCsv } from "@/shared/export/csv";
import { notifyError, notifySuccess } from "@/shared/notifications/toast";
import { formatCurrency, formatDateKey, isCompletedStatus } from "@/shared/utils/format";

export const Route = createFileRoute("/owner/financial")({
  head: () => ({ meta: [{ title: "Financeiro — King's Barber" }] }),
  component: OwnerFinancial,
});

function OwnerFinancial() {
  const { appointments, employees, products, loading, error } = useOwnerData();

  useEffect(() => {
    if (error) notifyError(error);
  }, [error]);

  const completed = appointments.filter((appointment) => isCompletedStatus(appointment.status));
  const currentMonth = filterMonth(completed, new Date());
  const previousMonth = filterMonth(completed, subMonths(new Date(), 1));
  const revenue = sumRevenue(currentMonth);
  const previousRevenue = sumRevenue(previousMonth);
  const variation = previousRevenue ? ((revenue - previousRevenue) / previousRevenue) * 100 : null;
  const commissions = buildCommissions(currentMonth, employees);
  const totalCommissions = commissions.reduce((sum, item) => sum + item.commission, 0);
  const inventoryValue = products.reduce((sum, product) => sum + product.stock * product.price, 0);
  const chartData = buildLastTwelveMonths(completed);

  function exportCommissions() {
    const downloaded = downloadCsv(
      `comissoes-${formatDateKey(new Date())}.csv`,
      commissions.map((item) => ({
        barbeiro: item.employee.name,
        atendimentos: item.appointments,
        faturamento: item.revenue,
        taxa_percentual: item.rate,
        comissao: item.commission,
      })),
    );
    if (downloaded) notifySuccess("Comissões exportadas.");
    else notifyError("Não há comissões para exportar.");
  }

  return (
    <AppShell role="owner">
      <PageHeader
        eyebrow="Receita comprovada"
        title="Visão financeira"
        subtitle="Faturamento e comissões derivados dos atendimentos concluídos."
      />

      {loading ? (
        <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-gold" /> Consolidando valores
        </div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              label="Faturamento no mês"
              value={formatCurrency(revenue)}
              delta={
                variation === null
                  ? "Sem base no mês anterior"
                  : `${variation >= 0 ? "+" : ""}${variation.toFixed(1)}% vs. mês anterior`
              }
              icon={DollarSign}
            />
            <StatCard
              label="Atendimentos pagos"
              value={String(currentMonth.length)}
              icon={ReceiptText}
            />
            <StatCard
              label="Comissões estimadas"
              value={formatCurrency(totalCommissions)}
              icon={Wallet}
            />
            <StatCard
              label="Valor do estoque"
              value={formatCurrency(inventoryValue)}
              delta="Custo não cadastrado"
              icon={Package}
            />
          </div>

          <section className="glass-card rounded-2xl p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="font-display text-xl">Últimos doze meses</h2>
              <p className="text-xs text-muted-foreground">
                Receita de serviços concluídos; não representa lucro.
              </p>
            </div>
            {chartData.some((item) => item.revenue > 0) ? (
              <div className="h-80">
                <ResponsiveContainer>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="owner-financial-revenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" vertical={false} />
                    <XAxis
                      dataKey="month"
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="var(--muted-foreground)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      width={58}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={{
                        background: "var(--popover)",
                        color: "var(--popover-foreground)",
                        border: "1px solid var(--border)",
                        borderRadius: 12,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="var(--gold)"
                      strokeWidth={2.5}
                      fill="url(#owner-financial-revenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <Empty text="Ainda não há receita concluída para exibir." />
            )}
          </section>

          <section className="glass-card mt-6 overflow-hidden rounded-2xl">
            <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <h2 className="font-display text-xl">Comissões deste mês</h2>
                <p className="text-xs text-muted-foreground">
                  Estimativa por taxa cadastrada em cada profissional.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={exportCommissions}>
                <Download className="h-4 w-4" /> Exportar CSV
              </Button>
            </div>
            {commissions.length ? (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border text-left text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4">Barbeiro</th>
                        <th className="px-6 py-4">Atendimentos</th>
                        <th className="px-6 py-4">Faturamento</th>
                        <th className="px-6 py-4">Taxa</th>
                        <th className="px-6 py-4 text-right">Comissão</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map((item) => (
                        <tr
                          key={item.employee.id}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {item.employee.image ? (
                                <img
                                  src={item.employee.image}
                                  alt=""
                                  className="h-9 w-9 rounded-full object-cover"
                                />
                              ) : null}
                              <span className="font-medium">{item.employee.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">{item.appointments}</td>
                          <td className="px-6 py-4">{formatCurrency(item.revenue)}</td>
                          <td className="px-6 py-4 text-muted-foreground">{item.rate}%</td>
                          <td className="px-6 py-4 text-right font-medium text-gold">
                            {formatCurrency(item.commission)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="divide-y divide-border md:hidden">
                  {commissions.map((item) => (
                    <article key={item.employee.id} className="p-4">
                      <div className="flex justify-between gap-3">
                        <div>
                          <h3 className="font-display text-lg">{item.employee.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {item.appointments} atendimentos · {item.rate}%
                          </p>
                        </div>
                        <span className="font-display text-lg text-gold">
                          {formatCurrency(item.commission)}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Sobre {formatCurrency(item.revenue)} faturados
                      </p>
                    </article>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-5 sm:p-6">
                <Empty text="Nenhuma comissão gerada neste mês." />
              </div>
            )}
          </section>

          <div className="mt-6 rounded-2xl border border-dashed border-border p-5 text-sm leading-relaxed text-muted-foreground">
            Lucro líquido, custos, taxas de cartão e meios de pagamento não são exibidos porque
            ainda não existem lançamentos de despesas e pagamentos no modelo de dados. Assim, o
            sistema evita apresentar estimativas como valores contábeis.
          </div>
        </>
      )}
    </AppShell>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
function filterMonth(appointments: AppointmentRecord[], reference: Date) {
  const start = startOfMonth(reference);
  const end = endOfMonth(reference);
  return appointments.filter(
    (item) =>
      item.appointment_date &&
      isWithinInterval(new Date(`${item.appointment_date}T12:00:00`), { start, end }),
  );
}
function sumRevenue(appointments: AppointmentRecord[]) {
  return appointments.reduce((sum, item) => sum + item.price, 0);
}
function buildCommissions(appointments: AppointmentRecord[], employees: EmployeeRecord[]) {
  return employees
    .map((employee) => {
      const matching = appointments.filter(
        (item) => item.barber_id === employee.id || item.barber === employee.name,
      );
      const revenue = sumRevenue(matching);
      const rate = employee.commissionRate ?? 30;
      return {
        employee,
        appointments: matching.length,
        revenue,
        rate,
        commission: (revenue * rate) / 100,
      };
    })
    .filter((item) => item.appointments > 0)
    .sort((a, b) => b.revenue - a.revenue);
}
function buildLastTwelveMonths(appointments: AppointmentRecord[]) {
  return Array.from({ length: 12 }, (_, index) => {
    const date = subMonths(new Date(), 11 - index);
    const matching = filterMonth(appointments, date);
    return {
      month: format(date, "MMM/yy", { locale: ptBR }).replace(".", ""),
      revenue: sumRevenue(matching),
    };
  });
}
