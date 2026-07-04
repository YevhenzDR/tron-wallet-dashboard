import type { CircularCounterparty, Counterparty, DestinationTraceSummary, Kpis } from "@/lib/types";
import { formatUsdt } from "@/lib/format";
import AddressLink from "./AddressLink";

function pct(part: number, whole: number): string {
  if (!whole) return "0";
  return (part / whole * 100).toLocaleString("uk-UA", { maximumFractionDigits: 1 });
}

export default function TypologyNotes({
  kpis,
  sources,
  circularCounterparties,
  traceSummary,
}: {
  kpis: Kpis;
  sources: Counterparty[];
  circularCounterparties: CircularCounterparty[];
  traceSummary?: DestinationTraceSummary;
}) {
  const exchangeSources = sources.filter((s) => s.is_exchange);
  const exchangeInflowTotal = exchangeSources.reduce((sum, s) => sum + s.total, 0);
  const exchangeInflowPct = pct(exchangeInflowTotal, kpis.total_in);

  const topCircular = [...circularCounterparties].sort((a, b) => b.net - a.net)[0];

  return (
    <div className="report-card rounded-md p-4 sm:p-6 flex flex-col gap-4 text-sm">
      <div>
        <h2 className="text-base font-medium" style={{ color: "var(--warn)" }}>
          Типологічні нотатки — попередній висновок
        </h2>
        <p className="text-sm text-[var(--foreground)] mt-1 leading-relaxed">
          Автоматично сформовано на основі агрегованих показників нижче. Мітки бірж наразі базуються
          лише на публічних тегах Tronscan — вони покривають гарячі гаманці бірж, але{" "}
          <span className="font-medium">не</span> покривають персональні депозитні адреси
          користувачів бірж. Тому кількість «біржових» адрес у цьому звіті, ймовірно,{" "}
          <span className="font-medium">занижена</span> — особливо на стороні відправлень.
          Точніша атрибуція очікується після подальшого кластерного аналізу адрес.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: "var(--warn)" }}>
            Наскрізний транзитний вузол
          </h3>
          <p className="text-sm text-[var(--foreground)] leading-relaxed">
            Залишок на гаманці — лише {formatUsdt(kpis.residual)} USDT при обороті понад{" "}
            {formatUsdt(kpis.total_in, 0)} USDT за {kpis.active_days} днів. Кошти від{" "}
            {kpis.unique_sources.toLocaleString("uk-UA")} джерел консолідуються та майже одразу
            розподіляються на {kpis.unique_destinations.toLocaleString("uk-UA")} отримувачів. Це типова
            поведінка транзитного/консолідаційного вузла в схемі лейерингу, а не кінцевої точки виведення
            коштів.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: "var(--warn)" }}>
            Асиметрія біржових міток
          </h3>
          <p className="text-sm text-[var(--foreground)] leading-relaxed">
            {exchangeSources.length} з {kpis.unique_sources.toLocaleString("uk-UA")} джерел позначені як
            біржі ({exchangeInflowPct}% від суми надходжень — {formatUsdt(exchangeInflowTotal, 0)} USDT),
            і жодного отримувача не позначено як біржу. Це очікувано: гарячі гаманці бірж видно, коли
            кошти <span className="font-medium">знімають</span> з біржі (вхід у цей
            гаманець), але коли кошти <span className="font-medium">вносять</span> на
            біржу, вони йдуть на одноразову депозитну адресу конкретного користувача, яку Tronscan не
            підписує. Відсутність позначених біржових отримувачів{" "}
            <span className="font-medium">не означає</span>, що кошти на біржі не
            повертались.
          </p>
        </div>

        <div className="flex flex-col gap-1.5">
          <h3 className="text-sm font-medium uppercase tracking-wider" style={{ color: "var(--warn)" }}>
            Циркулярні контрагенти
          </h3>
          <p className="text-sm text-[var(--foreground)] leading-relaxed">
            Виявлено {kpis.circular_counterparty_count} адрес по обидва боки потоку. Найбільша за сальдо
            —{" "}
            {topCircular ? (
              <span className="inline-block align-middle">
                <AddressLink
                  address={topCircular.address}
                  tag={topCircular.tag}
                  isExchange={topCircular.is_exchange}
                />
              </span>
            ) : (
              "—"
            )}
            {topCircular && (
              <>
                {" "}
                — надійшло {formatUsdt(topCircular.in_total, 0)} USDT, відправлено{" "}
                {formatUsdt(topCircular.out_total, 0)} USDT. Активний зустрічний обмін коштами з
                досліджуваним гаманцем — характерна ознака лейерингу через посередницькі адреси.
              </>
            )}
          </p>
        </div>
      </div>

      {traceSummary && (
        <div className="pt-3 border-t border-[var(--border)]">
          <h3 className="text-sm font-medium uppercase tracking-wider mb-1.5" style={{ color: "var(--warn)" }}>
            Простеження на один крок вперед
          </h3>
          <p className="text-sm text-[var(--foreground)] leading-relaxed">
            З {traceSummary.addresses_traced} найбільших отримувачів коштів{" "}
            {traceSummary.addresses_with_known_exchange_hits} відправляють кошти на адреси, вже
            позначені як біржові — на загальну суму{" "}
            {formatUsdt(traceSummary.total_exchange_hit_volume, 0)} USDT. Це підтверджує, що частина
            фактичного виведення в фіат/на біржу відбувається{" "}
            <span className="font-medium">через один крок після</span> досліджуваного
            гаманця. Детальний розподіл — у таблиці нижче.
          </p>
        </div>
      )}
    </div>
  );
}
