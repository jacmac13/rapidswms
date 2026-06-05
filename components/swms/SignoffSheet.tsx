'use client';

export function SignoffSheet() {
  const rows = Array.from({ length: 8 });

  return (
    <div>
      <h2 className="text-lg font-[family-name:var(--font-archivo-black)] text-brand-ink mb-4">
        Worker Sign-off
      </h2>
      <p className="text-sm text-brand-steel mb-4">
        All workers must read this SWMS and sign below before commencing work.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-brand-line rounded-lg overflow-hidden">
          <thead>
            <tr className="bg-brand-charcoal text-white">
              <th className="text-left px-4 py-2.5 font-semibold w-8">#</th>
              <th className="text-left px-4 py-2.5 font-semibold">Name</th>
              <th className="text-left px-4 py-2.5 font-semibold">Company / Role</th>
              <th className="text-left px-4 py-2.5 font-semibold">Signature</th>
              <th className="text-left px-4 py-2.5 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((_, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-brand-paper'}>
                <td className="px-4 py-3 text-brand-steel font-[family-name:var(--font-mono-plex)]">
                  {i + 1}
                </td>
                <td className="px-4 py-3 border-l border-brand-line">
                  <div className="h-5 border-b border-dashed border-brand-line w-full" />
                </td>
                <td className="px-4 py-3 border-l border-brand-line">
                  <div className="h-5 border-b border-dashed border-brand-line w-full" />
                </td>
                <td className="px-4 py-3 border-l border-brand-line">
                  <div className="h-5 border-b border-dashed border-brand-line w-full" />
                </td>
                <td className="px-4 py-3 border-l border-brand-line">
                  <div className="h-5 border-b border-dashed border-brand-line w-full" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
