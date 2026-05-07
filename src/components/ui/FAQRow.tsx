'use client';

import { useId, useState } from 'react';
import type { FaqBlock, FaqInline } from '@/src/lib/parseFaqMarkdown';
import styles from './FAQRow.module.css';

type FAQRowProps = {
  question: string;
  blocks: FaqBlock[];
  defaultOpen?: boolean;
};

export default function FAQRow({ question, blocks, defaultOpen = false }: FAQRowProps) {
  const [open, setOpen] = useState(defaultOpen);
  const answerId = useId();

  return (
    <div className={styles.row}>
      <button
        type="button"
        className={styles.question}
        aria-expanded={open}
        aria-controls={answerId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.questionText}>{question}</span>
        <span
          className={styles.iconBubble}
          data-open={open ? 'true' : 'false'}
          aria-hidden="true"
        >
          <svg
            className={styles.iconChevron}
            data-open={open ? 'true' : 'false'}
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      <div
        id={answerId}
        className={styles.answerWrap}
        data-open={open ? 'true' : 'false'}
        role="region"
      >
        <div className={styles.answerInner}>
          <div className={styles.answer}>
            {blocks.map((block, i) => renderBlock(block, i))}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderBlock(block: FaqBlock, key: number) {
  if (block.type === 'paragraph') {
    return (
      <p className={styles.paragraph} key={key}>
        {renderInline(block.runs)}
      </p>
    );
  }
  return (
    <ul className={styles.list} key={key}>
      {block.items.map((runs, i) => (
        <li key={i}>{renderInline(runs)}</li>
      ))}
    </ul>
  );
}

function renderInline(runs: FaqInline[]) {
  return runs.map((run, i) =>
    run.type === 'strong' ? (
      <strong className={styles.strong} key={i}>
        {run.text}
      </strong>
    ) : (
      <span key={i}>{run.text}</span>
    ),
  );
}
