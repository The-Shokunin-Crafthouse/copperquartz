'use client';

import { useMemo, useState } from 'react';
import { useCountUp } from '@/src/hooks/useCountUp';
import { exportRsvpCSV } from '@/src/app/actions/exportRsvpCSV';
import type {
  AdminRsvpSummary,
  BeverageBreakdownRow,
} from '@/src/app/actions/getAdminRsvpSummary';
import type { Contribution } from './types';
import { fundLabel, formatUsd, formatTimestamp } from './format';
import styles from './AdminDashboard.module.css';

type Pill = 'special' | 'contributions' | 'drinks' | 'not-coming';

const PILLS: { id: Pill; label: string }[] = [
  { id: 'special', label: 'Special Request' },
  { id: 'contributions', label: 'Contributions' },
  { id: 'drinks', label: 'Drink Requests' },
  { id: 'not-coming', label: 'Not Coming' },
];

/* Cocktails always renders on the Drinks panel — synthesized at count 0
   when absent so the default-active card has something to land on and
   the table below shows the empty state. */
const DEFAULT_DRINK_CATEGORY = 'cocktail';

type DrinkCategorySummary = {
  category: string;
  label: string;       /* card eyebrow — plural, uppercase */
  headerLabel: string; /* breakdown table header — singular, uppercase */
  count: number;
};

/* Normalize a category slug like "non-alcoholic" or "Wine" into UI
   labels. The card eyebrow is plural where it makes sense; the table
   header is the singular form. Multi-word slugs use a single trailing
   's' only when the head noun pluralizes that way. */
function categoryLabels(category: string): {
  plural: string;
  singular: string;
} {
  const upper = category.trim().toUpperCase();
  const NO_PLURAL = new Set(['WINE', 'BEER', 'NON-ALCOHOLIC']);
  if (NO_PLURAL.has(upper)) return { plural: upper, singular: upper };
  return { plural: `${upper}S`, singular: upper };
}

function giftCents(r: Contribution): number {
  return r.gift_cents ?? r.amount_cents;
}

function downloadFilename(): string {
  return `rsvp-responses-${new Date().toISOString().slice(0, 10)}.csv`;
}

/* Small wrapper so each stat card owns its own count-up hook (hooks
   can't run inside loops). animate=false keeps the dollar prefix from
   re-rendering during the count. */
function StatCard({
  eyebrow,
  prefix,
  target,
  subtext,
  light,
}: {
  eyebrow: string;
  prefix?: string;
  target: number;
  subtext: string;
  light?: boolean;
}) {
  const value = useCountUp(target);
  return (
    <article
      className={`${styles.card} ${light ? styles.cardLight : ''}`}
    >
      <p className={styles.cardEyebrow}>{eyebrow}</p>
      <p className={styles.cardNumber}>
        {prefix}
        {value}
      </p>
      <p className={styles.cardSubtext}>{subtext}</p>
    </article>
  );
}

function DrinkCategoryCard({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  const value = useCountUp(count);
  return (
    <button
      type="button"
      className={`${styles.drinkCard} ${active ? styles.drinkCardActive : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <p className={styles.drinkCardEyebrow}>{label}</p>
      <p className={styles.drinkCardNumber}>{value}</p>
    </button>
  );
}

export default function AdminDashboard({
  contributions,
  summary,
}: {
  contributions: Contribution[];
  summary: AdminRsvpSummary;
}) {
  const [activePill, setActivePill] = useState<Pill>('special');
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  /* Contribution totals — same gift-vs-charged logic as the legacy
     SummaryCards: sum the gift the couple actually receives. */
  const totals = useMemo(() => {
    const sumFor = (fund: Contribution['fund'], selfReported: boolean) =>
      contributions
        .filter((c) => c.fund === fund && c.self_reported === selfReported)
        .reduce((s, c) => s + giftCents(c), 0);
    const countFor = (fund: Contribution['fund'], selfReported: boolean) =>
      contributions.filter(
        (c) => c.fund === fund && c.self_reported === selfReported,
      ).length;

    const honeymoonCents = sumFor('honeymoon', false);
    const kivaCents = sumFor('kiva', false);
    const hdmgCents = sumFor('howlin-dog', true);

    return {
      honeymoonDollars: Math.round(honeymoonCents / 100),
      honeymoonCount: countFor('honeymoon', false),
      kivaDollars: Math.round(kivaCents / 100),
      kivaCount: countFor('kiva', false),
      hdmgDollars: Math.round(hdmgCents / 100),
      hdmgCount: countFor('howlin-dog', true),
    };
  }, [contributions]);

  /* Drink category cards — derived from beverage_breakdown so we don't
     hardcode the universe of categories. Cocktails is synthesized at
     0 if absent so the default-active card always renders. Sort by
     count DESC, stable on label. */
  const drinkCategories = useMemo<DrinkCategorySummary[]>(() => {
    const byCategory = new Map<string, number>();
    for (const row of summary.beverage_breakdown) {
      byCategory.set(
        row.category,
        (byCategory.get(row.category) ?? 0) + row.count,
      );
    }
    if (!byCategory.has(DEFAULT_DRINK_CATEGORY)) {
      byCategory.set(DEFAULT_DRINK_CATEGORY, 0);
    }
    const list = Array.from(byCategory.entries()).map(([category, count]) => {
      const { plural, singular } = categoryLabels(category);
      return {
        category,
        label: plural,
        headerLabel: singular,
        count,
      };
    });
    list.sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.category.localeCompare(b.category);
    });
    return list;
  }, [summary.beverage_breakdown]);

  const [activeCategory, setActiveCategory] = useState<string>(
    DEFAULT_DRINK_CATEGORY,
  );

  const activeCategoryRow = drinkCategories.find(
    (c) => c.category === activeCategory,
  );

  const drinkBreakdownRows: BeverageBreakdownRow[] = useMemo(() => {
    return summary.beverage_breakdown
      .filter((r) => r.category === activeCategory)
      .slice()
      .sort((a, b) => b.count - a.count);
  }, [summary.beverage_breakdown, activeCategory]);

  async function onExport() {
    setExportBusy(true);
    setExportError(null);
    try {
      const result = await exportRsvpCSV();
      if ('error' in result) {
        setExportError(result.error);
        return;
      }
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFilename();
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Export failed.');
    } finally {
      setExportBusy(false);
    }
  }

  return (
    <div className={styles.dashboard}>
      {/* -------------------- Section 1 — Totals -------------------- */}
      <section className={styles.section} aria-labelledby="admin-totals-heading">
        <h2 id="admin-totals-heading" className={styles.sectionHeading}>
          Totals
        </h2>
        <div className={styles.totalsGrid}>
          <StatCard
            eyebrow="ATTENDING"
            target={summary.attending_count}
            subtext={`${summary.awaiting_count} yet to respond`}
            light
          />
          <StatCard
            eyebrow="MONDAY MEETUP"
            target={summary.monday_count}
            subtext={`${summary.monday_count} joining Monday night`}
          />
          <StatCard
            eyebrow="TRANSPORTATION"
            target={summary.transport_party_count}
            subtext={`${summary.transport_party_count} parties need a ride`}
          />
          <StatCard
            eyebrow="HONEYMOON FUND"
            prefix="$"
            target={totals.honeymoonDollars}
            subtext={`${totals.honeymoonCount} contributions`}
          />
          <StatCard
            eyebrow="KIVA"
            prefix="$"
            target={totals.kivaDollars}
            subtext={`${totals.kivaCount} contributions`}
          />
          <StatCard
            eyebrow="HOWLIN DOG MUSIC GROUP"
            prefix="$"
            target={totals.hdmgDollars}
            subtext={`${totals.hdmgCount} self-reported`}
          />
        </div>
      </section>

      {/* -------------------- Section 2 — Switcher -------------------- */}
      <section
        className={styles.switcher}
        aria-labelledby="admin-switcher-heading"
      >
        <h2
          id="admin-switcher-heading"
          className={styles.sectionHeading}
          /* Visually redundant with the pill row — keep for AT but hide. */
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: -1,
            overflow: 'hidden',
            clip: 'rect(0,0,0,0)',
            whiteSpace: 'nowrap',
            border: 0,
          }}
        >
          Responses
        </h2>

        <div className={styles.pillRow}>
          <div className={styles.pillScroll} role="tablist">
            {PILLS.map((pill) => {
              const active = pill.id === activePill;
              return (
                <button
                  key={pill.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`${styles.pill} ${active ? styles.pillActive : ''}`}
                  onClick={() => setActivePill(pill.id)}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            className={styles.exportBtn}
            onClick={onExport}
            disabled={exportBusy}
          >
            {exportBusy ? 'Preparing…' : 'Export CSV'}
          </button>
        </div>

        {exportError ? (
          <p className={styles.exportError}>{exportError}</p>
        ) : null}

        {/* ---------- Active panel ---------- */}
        {activePill === 'special' ? (
          <div className={styles.panel}>
            <div className={styles.tableScroll}>
              <div className={`${styles.tableHead} ${styles.colsSpecial}`}>
                <span className={styles.tableHeadCell}>Name</span>
                <span className={styles.tableHeadCell}>Party Name</span>
                <span className={styles.tableHeadCell}>Special Request</span>
              </div>
              <div className={styles.tableDivider} role="presentation" />
              {summary.special_requests.length === 0 ? (
                <div className={styles.empty}>No special requests yet.</div>
              ) : (
                <div className={styles.tableBody}>
                  {summary.special_requests.map((req, idx) => (
                    <div
                      key={`${req.party_name}-${req.updated_at}-${idx}`}
                      className={`${styles.tableRow} ${styles.colsSpecial}`}
                    >
                      <span className={styles.tableCell}>
                        {req.last_edited_by_first_name ?? (
                          <span className={styles.dash}>—</span>
                        )}
                      </span>
                      <span className={styles.tableCell}>
                        {req.party_name || (
                          <span className={styles.dash}>—</span>
                        )}
                      </span>
                      <span
                        className={`${styles.tableCell} ${styles.tableCellWrap}`}
                      >
                        {req.notes}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activePill === 'contributions' ? (
          <div className={styles.panel}>
            <div className={styles.tableScroll}>
              <div className={`${styles.tableHead} ${styles.colsContributions}`}>
                <span className={styles.tableHeadCell}>Party Name</span>
                <span className={styles.tableHeadCell}>Fund</span>
                <span className={styles.tableHeadCell}>Gift Amount</span>
                <span className={styles.tableHeadCell}>Message</span>
                <span className={styles.tableHeadCell}>Kiva URL</span>
                <span className={styles.tableHeadCell}>Date</span>
              </div>
              <div className={styles.tableDivider} role="presentation" />
              {contributions.length === 0 ? (
                <div className={styles.empty}>No contributions yet.</div>
              ) : (
                <div className={styles.tableBody}>
                  {contributions.map((row) => (
                    <div
                      key={row.id}
                      className={`${styles.tableRow} ${styles.colsContributions}`}
                    >
                      <span className={styles.tableCell}>{row.name}</span>
                      <span className={styles.tableCell}>
                        {fundLabel(row.fund)}
                      </span>
                      <span className={styles.tableCell}>
                        {formatUsd(giftCents(row))}
                      </span>
                      <span
                        className={`${styles.tableCell} ${styles.tableCellWrap}`}
                      >
                        {row.message || (
                          <span className={styles.dash}>—</span>
                        )}
                      </span>
                      <span className={styles.tableCell}>
                        {row.reference_url ? (
                          <a
                            href={row.reference_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.link}
                          >
                            {row.reference_url}
                          </a>
                        ) : (
                          <span className={styles.dash}>—</span>
                        )}
                      </span>
                      <span className={styles.tableCell}>
                        {formatTimestamp(row.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}

        {activePill === 'drinks' ? (
          <div className={styles.drinkSection}>
            <div className={styles.drinkCardScroll}>
              {drinkCategories.map((cat) => (
                <DrinkCategoryCard
                  key={cat.category}
                  label={cat.label}
                  count={cat.count}
                  active={cat.category === activeCategory}
                  onClick={() => setActiveCategory(cat.category)}
                />
              ))}
            </div>

            <div className={styles.panel}>
              <div className={styles.tableScroll}>
                <div className={`${styles.tableHead} ${styles.colsDrinks}`}>
                  <span className={styles.tableHeadCell}>Count</span>
                  <span className={styles.tableHeadCell}>
                    {activeCategoryRow
                      ? `${activeCategoryRow.headerLabel} NAME`
                      : 'DRINK NAME'}
                  </span>
                </div>
                <div className={styles.tableDivider} role="presentation" />
                {drinkBreakdownRows.length === 0 ? (
                  <div className={styles.empty}>
                    No{' '}
                    {activeCategoryRow
                      ? activeCategoryRow.headerLabel.toLowerCase()
                      : 'drink'}{' '}
                    selections yet.
                  </div>
                ) : (
                  <div className={styles.tableBody}>
                    {drinkBreakdownRows.map((row, idx) => (
                      <div
                        key={`${row.category}-${row.selection ?? 'null'}-${idx}`}
                        className={`${styles.tableRow} ${styles.colsDrinks}`}
                      >
                        <span className={styles.tableCell}>{row.count}</span>
                        <span className={styles.tableCell}>
                          {row.selection ?? (
                            <span className={styles.dash}>—</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {activePill === 'not-coming' ? (
          <div className={styles.panel}>
            <div className={styles.tableScroll}>
              <div className={`${styles.tableHead} ${styles.colsNotComing}`}>
                <span className={styles.tableHeadCell}>Name</span>
                <span className={styles.tableHeadCell}>Party</span>
              </div>
              <div className={styles.tableDivider} role="presentation" />
              {summary.declining_guests.length === 0 ? (
                <div className={styles.empty}>No declines yet.</div>
              ) : (
                <div className={styles.tableBody}>
                  {summary.declining_guests.map((g) => (
                    <div
                      key={g.guest_id}
                      className={`${styles.tableRow} ${styles.colsNotComing}`}
                    >
                      <span className={styles.tableCell}>{g.full_name}</span>
                      <span className={styles.tableCell}>
                        {g.party_name || (
                          <span className={styles.dash}>—</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
