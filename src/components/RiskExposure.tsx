import type { RiskDetailEntry, WalletRisk } from "@/lib/types";
import { formatUsdt } from "@/lib/format";

interface EntityNote {
  note: string;
  confirmed: boolean;
}

const ENTITY_NOTES: Record<string, EntityNote> = {
  "garantex.io": {
    note: "Російська біржа. Санкції OFAC США (SDN-список, квітень 2022) за сприяння транзакціям для програм-вимагачів і даркнет-ринків; вилучена правоохоронними органами у 2025 р. Як російська фінансова структура, підпадає під санкції РНБО України.",
    confirmed: true,
  },
  rapira: {
    note: "Російська біржа. Як російська фінансова структура підпадає під санкції РНБО України. Статус щодо санкцій OFAC США потребує окремої перевірки.",
    confirmed: true,
  },
  "grinex.io": {
    note: "Російська біржа. Як російська фінансова структура підпадає під санкції РНБО України. Статус щодо санкцій OFAC США потребує окремої перевірки.",
    confirmed: true,
  },
  "cryptex.net": {
    note: "Російська біржа/OTC-платформа. Як російська фінансова структура підпадає під санкції РНБО України. Статус щодо санкцій OFAC США потребує окремої перевірки.",
    confirmed: true,
  },
  "nobitex.ir": {
    note: "Найбільша іранська біржа. Іран перебуває під всеосяжним торговельним ембарго OFAC США — будь-яка іранська фінансова установа підпадає під санкційний режим за юрисдикційною ознакою.",
    confirmed: true,
  },
  huionepay: {
    note: "Група Huione (Камбоджа). У 2025 р. FinCEN США застосувало щодо групи спеціальний захід за Розділом 311 Патріотичного акту як до установи, що викликає основне занепокоєння щодо відмивання коштів (пов'язана з мережами шахрайських кол-центрів у Південно-Східній Азії).",
    confirmed: true,
  },
};

function entityNote(entity: string): EntityNote {
  return (
    ENTITY_NOTES[entity.toLowerCase()] ?? {
      note: "Потребує перевірки за офіційним державним реєстром санкцій (напр. OFAC SDN, реєстр санкцій РНБО України). Конкретний санкційний статус не підтверджено.",
      confirmed: false,
    }
  );
}

const RISK_TYPE_LABEL: Record<string, string> = {
  sanctioned_entity: "санкційна/високоризикова організація",
  illicit_activity: "незаконна діяльність",
};

const ACTIVITY_LABEL: Record<string, string> = {
  Theft: "крадіжка коштів",
  "OFAC Sanctions": "загальна позначка санкцій OFAC",
  "USDT Banned Address": "адреса у чорному списку USDT (Tether)",
  "WOO X Exploiter": "експлойт біржі WOO X",
  Phishing: "фішинг",
  "Dusting Attack": "dusting-атака (мітка для деанонімізації)",
  "Terrorism Financing": "фінансування тероризму",
};

function riskLevelColor(level: string): string {
  const l = level.toLowerCase();
  if (l === "severe" || l === "high") return "var(--outflow)";
  if (l === "moderate") return "var(--warn)";
  return "var(--muted)";
}

function RiskRow({ entry }: { entry: RiskDetailEntry }) {
  const isEntity = entry.risk_type === "sanctioned_entity";
  const label = isEntity ? entry.entity : ACTIVITY_LABEL[entry.entity] ?? entry.entity;
  const note = isEntity ? entityNote(entry.entity) : null;
  const hops = Object.keys(entry.hop_dic).length;

  return (
    <div className="border-t border-[var(--border)] py-3 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{label}</span>
          <span
            className="text-[10px] px-1.5 py-0.5 rounded border whitespace-nowrap"
            style={
              isEntity
                ? { color: "var(--danger)", borderColor: "var(--danger)" }
                : { color: "var(--warn)", borderColor: "var(--warn)" }
            }
          >
            {RISK_TYPE_LABEL[entry.risk_type] ?? entry.risk_type}
          </span>
          {note && !note.confirmed && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--muted)] whitespace-nowrap">
              потребує перевірки
            </span>
          )}
        </div>
        <span className="text-sm mono" style={{ color: "var(--outflow)" }}>
          ${formatUsdt(entry.volume, 0)} · {entry.percent}%
        </span>
      </div>
      <p className="text-sm text-[var(--foreground)] opacity-80 mt-1.5 leading-relaxed">
        {entry.exposure_type === "direct"
          ? `Пряме (1 крок) підключення до цієї позначки.`
          : `Непряме підключення через ${hops - 1} посередників (${entry.hop_num} ${
              entry.hop_num === 1 ? "крок" : "кроки"
            } до гаманця).`}
      </p>
      {note && <p className="text-sm text-[var(--foreground)] opacity-80 mt-1.5 leading-relaxed">{note.note}</p>}
    </div>
  );
}

export default function RiskExposure({ risk }: { risk: WalletRisk }) {
  const sorted = [...risk.risk_detail].sort((a, b) => b.volume - a.volume);
  const entityHits = sorted.filter((e) => e.risk_type === "sanctioned_entity");
  const activityHits = sorted.filter((e) => e.risk_type !== "sanctioned_entity");

  return (
    <div
      className="report-card rounded-md p-4 sm:p-6 flex flex-col gap-4"
      style={{ borderColor: "var(--danger)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-medium" style={{ color: "var(--danger)" }}>
            Ризикова та санкційна експозиція
          </h2>
          <p className="text-sm text-[var(--foreground)] opacity-80 mt-1 leading-relaxed">
            Аналіз багатоступеневих (мульти-хоп) зв&apos;язків гаманця з відомими санкційними/високоризиковими
            організаціями та випадками незаконної діяльності — на відміну від простих публічних тегів,
            враховує кошти, що пройшли через посередницькі адреси.
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-semibold mono" style={{ color: riskLevelColor(risk.risk_level) }}>
            {risk.score}/100
          </div>
          <div className="text-xs text-[var(--muted)]">рівень ризику: {risk.risk_level}</div>
        </div>
      </div>

      {entityHits.length > 0 && (
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wider mb-1" style={{ color: "var(--warn)" }}>
            Санкційні / високоризикові організації ({entityHits.length})
          </h3>
          {entityHits.map((e, i) => (
            <RiskRow key={e.entity + i} entry={e} />
          ))}
        </div>
      )}

      {activityHits.length > 0 && (
        <div>
          <h3 className="text-sm font-medium uppercase tracking-wider mb-1" style={{ color: "var(--warn)" }}>
            Позначки незаконної діяльності ({activityHits.length})
          </h3>
          {activityHits.map((e, i) => (
            <RiskRow key={e.entity + i} entry={e} />
          ))}
        </div>
      )}

      <p className="text-xs text-[var(--muted)] italic pt-2 border-t border-[var(--border)]">
        Дані отримано через MistTrack (аналіз мульти-хоп зв&apos;язків). Санкційний статус, позначений як
        &quot;потребує перевірки&quot;, не підтверджено з офіційним державним реєстром і не повинен
        використовуватись як остаточний доказ без незалежної перевірки.
      </p>
    </div>
  );
}
