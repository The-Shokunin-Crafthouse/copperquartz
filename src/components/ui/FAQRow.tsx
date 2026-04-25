'use client';

import { useId, useState } from 'react';
import styles from './FAQRow.module.css';

type FAQRowProps = {
  question: string;
  answer: string;
  defaultOpen?: boolean;
};

export default function FAQRow({ question, answer, defaultOpen = false }: FAQRowProps) {
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
        <span className={styles.icon} aria-hidden="true">
          {open ? '−' : '+'}
        </span>
      </button>
      <div id={answerId} className={styles.answerWrap} hidden={!open}>
        <p className={styles.answer}>{answer}</p>
      </div>
    </div>
  );
}
