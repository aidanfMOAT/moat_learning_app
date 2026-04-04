type Props = { text: string };

export function SlideContent({ text }: Props) {
  const lines = text.split('\n').filter((l) => l.trim() !== '');
  if (lines.length === 0) return null;

  // First line is a heading unless it starts with a list marker
  const firstIsHeading = !/^[-,]/.test(lines[0].trim()) && !/^\d+\./.test(lines[0].trim());
  const heading = firstIsHeading ? lines[0].trim() : null;
  const bodyLines = firstIsHeading ? lines.slice(1) : lines;

  // Group body lines into runs of bullets, numbered items, or paragraphs
  type Run = { kind: 'ul' | 'ol' | 'p'; items: string[] };
  const runs: Run[] = [];

  for (const line of bodyLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const isBullet = /^[-,]\s+/.test(trimmed);
    const isOrdered = /^\d+\.\s+/.test(trimmed);
    const kind: Run['kind'] = isBullet ? 'ul' : isOrdered ? 'ol' : 'p';
    const content = isBullet
      ? trimmed.replace(/^[-,]\s+/, '')
      : isOrdered
      ? trimmed.replace(/^\d+\.\s+/, '')
      : trimmed;

    const last = runs[runs.length - 1];
    if (last && last.kind === kind) {
      last.items.push(content);
    } else {
      runs.push({ kind, items: [content] });
    }
  }

  return (
    <div>
      {heading && <h3 className="slide-section-heading">{heading}</h3>}
      <div className="slide-body slide-bullets">
        {runs.map((run, i) => {
          if (run.kind === 'ul') {
            return (
              <ul key={i}>
                {run.items.map((item, j) => <li key={j}>{item}</li>)}
              </ul>
            );
          }
          if (run.kind === 'ol') {
            return (
              <ol key={i}>
                {run.items.map((item, j) => <li key={j}>{item}</li>)}
              </ol>
            );
          }
          return (
            <p key={i}>{run.items[0]}</p>
          );
        })}
      </div>
    </div>
  );
}
