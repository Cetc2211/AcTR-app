'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: '2rem', background: '#fdf8f0', fontFamily: 'Georgia, serif', color: '#4a3728' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', background: '#fff', borderRadius: 12, boxShadow: '0 2px 24px rgba(0,0,0,0.08)', padding: '2rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#8b1a1a', margin: '0 0 1rem' }}>
            Error Global
          </h1>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '1rem', marginBottom: '1rem' }}>
            <p style={{ fontWeight: 600, margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#991b1b' }}>Mensaje:</p>
            <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#7f1d1d', margin: 0, wordBreak: 'break-word' }}>
              {error.message || 'Error desconocido'}
            </p>
          </div>
          {error.stack && (
            <details style={{ marginBottom: '1rem' }}>
              <summary style={{ cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: '#4a3728', marginBottom: '0.5rem' }}>
                Ver traza completa (stack)
              </summary>
              <pre style={{ background: '#f5f5f4', borderRadius: 6, padding: '0.75rem', fontSize: '0.75rem', overflowX: 'auto', color: '#333', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 300, overflowY: 'auto' }}>
                {error.stack}
              </pre>
            </details>
          )}
          {error.digest && (
            <p style={{ fontSize: '0.75rem', color: '#888', margin: '0 0 1rem' }}>Digest: {error.digest}</p>
          )}
          <button
            onClick={() => reset()}
            style={{ padding: '0.65rem 1.5rem', background: '#8b1a1a', color: '#fdf8f0', border: 'none', borderRadius: 8, fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}
          >
            Intentar de nuevo
          </button>
        </div>
      </body>
    </html>
  );
}
