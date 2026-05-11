import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import FAQRow from '@/src/components/ui/FAQRow';
import {
  parseFaqMarkdown,
  type FaqDocument,
  type FaqInline,
} from '@/src/lib/parseFaqMarkdown';
import styles from './page.module.css';

/*
 * Q&A — Figma frame 22:1243.
 *   - Hero heading "Questions… answered" (Cormorant SemiBold, palm-leaf).
 *   - Sections from public/copy/faq-content.md, each rendered as a small-
 *     caps eyebrow over a vertical accordion list (FAQRow).
 *   - Closing italic note rendered centered below the list.
 *
 * The markdown is read at build time so no client-side fetch fires.
 */
export const metadata = {
  title: 'Q&A · Levi & Meghan',
  description:
    'Logistics, dress code, RSVPs, food, travel, gifts, and venue questions answered for Bahn × Cave on September 29, 2026.',
};

function loadFaq(): FaqDocument {
  const path = join(process.cwd(), 'public/copy/faq-content.md');
  try {
    return parseFaqMarkdown(readFileSync(path, 'utf8'));
  } catch {
    return { sections: [], closingNote: null };
  }
}

export default function QAPage() {
  const faq = loadFaq();

  return (
    <article className={styles.qa}>
      <h2 id="qa-title" className={styles.heading}>
        Questions&hellip; answered
      </h2>

      <div className={styles.list}>
        {faq.sections.map((section) => (
          <section key={section.title} className={styles.section}>
            <h3 className={styles.eyebrow}>{section.title}</h3>
            <div className={styles.rows}>
              {section.items.map((item) => (
                <FAQRow
                  key={item.question}
                  question={item.question}
                  blocks={item.blocks}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {faq.closingNote ? (
        <p className={styles.closing}>{renderClosing(faq.closingNote)}</p>
      ) : null}
    </article>
  );
}

function renderClosing(runs: FaqInline[]) {
  return runs.map((run, i) =>
    run.type === 'strong' ? <strong key={i}>{run.text}</strong> : <span key={i}>{run.text}</span>,
  );
}
