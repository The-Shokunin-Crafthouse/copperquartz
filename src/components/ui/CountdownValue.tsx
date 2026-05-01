type CountdownValueProps = {
  /** ISO yyyy-mm-dd target date. */
  target: string;
};

/*
 * Build-time countdown — server component, computes days remaining when
 * the static export runs. The number freezes at deploy time and refreshes
 * on the next deploy. Acceptable for v1; if a live counter is needed
 * later, replace with a client component that recomputes in useEffect.
 */
export default function CountdownValue({ target }: CountdownValueProps) {
  const targetDate = new Date(`${target}T00:00:00Z`);
  const now = new Date();
  const msPerDay = 1000 * 60 * 60 * 24;
  const days = Math.max(
    0,
    Math.ceil((targetDate.getTime() - now.getTime()) / msPerDay),
  );

  if (days === 0) return <>The day is here</>;
  if (days === 1) return <>1 day left</>;
  return <>{days} days left</>;
}
