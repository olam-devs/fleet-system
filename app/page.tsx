const trips = [
  { vehicle: 'T 482 DKL', route: 'Kibaha Depot → Morogoro DC', status: 'In transit', progress: 68, eta: '14:35', source: 'Verified' },
  { vehicle: 'T 193 EAV', route: 'Dar Port → Mkuranga Yard', status: 'At start point', progress: 8, eta: '15:10', source: 'Live' },
  { vehicle: 'T 771 CQM', route: 'Bagamoyo → Tegeta Hub', status: 'To start point', progress: 31, eta: '16:05', source: 'Alternate GPS' },
];

const alerts = [
  { title: 'Workshop stay overdue', detail: 'T 445 DNP · 2 days over', action: 'Urgent' },
  { title: 'Location sources differ', detail: 'T 118 EGM · 1.8 km apart', action: 'Review' },
  { title: 'GPS update delayed', detail: 'T 602 DZU · last seen 12 min ago', action: 'Check' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f6f2] text-[#17211b]">
      <header className="border-b border-[#dce2dc] bg-[#fbfcf9] px-4 py-4 lg:px-8">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-[#173f35] text-lg font-bold text-white">S</div>
            <div><p className="font-semibold leading-tight">Starlink Fleet System</p><p className="text-xs text-[#68756d]">Fleet movement control</p></div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-[#e5f4ec] px-3 py-1.5 text-xs font-semibold text-[#16613f] sm:inline">● 18 vehicles reporting</span>
            <button className="rounded-xl bg-[#e56a3d] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#cf592f]">+ New trip</button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-5 p-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:p-8">
        <aside className="hidden lg:block">
          <nav className="space-y-1 text-sm font-medium">
            <a className="flex items-center gap-3 rounded-xl bg-[#dfeae3] px-4 py-3 text-[#173f35]" href="#">▦ Overview</a>
            {['↗ Active trips', '▤ Schedule', '⬡ Vehicles', '⌖ Locations', '⚒ Workshop', '◌ Trip history'].map((item) => <a key={item} className="flex rounded-xl px-4 py-3 text-[#59665e] hover:bg-white" href="#">{item}</a>)}
          </nav>
          <div className="mt-8 rounded-2xl bg-[#173f35] p-4 text-white">
            <p className="text-xs uppercase tracking-[.14em] text-[#a8c6b9]">Data health</p>
            <p className="mt-2 text-2xl font-semibold">94%</p>
            <p className="mt-1 text-xs leading-5 text-[#c9dbd3]">16 of 18 active vehicles have fresh, verified positions.</p>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div><p className="text-sm font-medium text-[#e56a3d]">Thursday, 2 October</p><h1 className="mt-1 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Operations at a glance</h1></div>
            <p className="text-sm text-[#68756d]">Last refreshed just now</p>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[
              ['Active trips', '7', '3 arriving today'], ['Awaiting start', '4', 'Next at 14:20'], ['In workshop', '6', '1 overdue'], ['Completed today', '12', '86% on time'],
            ].map(([label, value, note]) => <article key={label} className="rounded-2xl border border-[#dce2dc] bg-white p-4 shadow-[0_8px_30px_rgba(29,49,38,.04)]"><p className="text-sm text-[#68756d]">{label}</p><p className="my-2 text-3xl font-semibold tracking-tight">{value}</p><p className="text-xs font-medium text-[#50705e]">{note}</p></article>)}
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.75fr)]">
            <article className="overflow-hidden rounded-3xl border border-[#dce2dc] bg-[#dce9e3] shadow-[0_12px_40px_rgba(29,49,38,.06)]">
              <div className="flex items-center justify-between bg-white px-5 py-4"><div><h2 className="font-semibold">Live movement</h2><p className="text-xs text-[#68756d]">Verified positions across active journeys</p></div><button className="rounded-lg border border-[#dce2dc] px-3 py-2 text-xs font-semibold">Open full map</button></div>
              <div className="relative h-[360px] overflow-hidden bg-[linear-gradient(35deg,transparent_47%,rgba(255,255,255,.65)_48%,rgba(255,255,255,.65)_52%,transparent_53%),linear-gradient(110deg,transparent_47%,rgba(255,255,255,.55)_48%,rgba(255,255,255,.55)_52%,transparent_53%)] bg-[length:150px_130px]">
                <div className="absolute left-[18%] top-[60%] h-2 w-[56%] -rotate-[14deg] rounded-full bg-[#e56a3d] shadow-[0_0_0_4px_rgba(229,106,61,.15)]" />
                <span className="absolute left-[15%] top-[62%] size-5 rounded-full border-4 border-white bg-[#173f35] shadow-lg" />
                <span className="absolute left-[49%] top-[48%] grid size-9 place-items-center rounded-full border-4 border-white bg-[#e56a3d] text-xs font-bold text-white shadow-lg">68</span>
                <span className="absolute left-[73%] top-[36%] size-5 rounded-full border-4 border-white bg-[#173f35] shadow-lg" />
                <div className="absolute bottom-4 left-4 rounded-xl bg-white/95 px-4 py-3 shadow-lg"><p className="text-xs font-semibold text-[#e56a3d]">T 482 DKL</p><p className="text-sm font-medium">68% to Morogoro DC</p><p className="mt-1 text-xs text-[#68756d]">Position cross-checked</p></div>
              </div>
            </article>

            <article className="rounded-3xl border border-[#dce2dc] bg-white p-5 shadow-[0_12px_40px_rgba(29,49,38,.05)]">
              <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Needs attention</h2><p className="text-xs text-[#68756d]">Exceptions, not noise</p></div><span className="rounded-full bg-[#fff0e9] px-2.5 py-1 text-xs font-bold text-[#bb4b27]">3</span></div>
              <div className="space-y-3">{alerts.map((alert, index) => <div key={alert.title} className="rounded-2xl border border-[#e4e8e3] p-4"><div className="flex gap-3"><span className={`mt-1 size-2.5 shrink-0 rounded-full ${index === 0 ? 'bg-red-500' : index === 1 ? 'bg-amber-500' : 'bg-slate-400'}`} /><div><p className="text-sm font-semibold">{alert.title}</p><p className="mt-1 text-xs text-[#68756d]">{alert.detail}</p><button className="mt-3 text-xs font-semibold text-[#c45530]">{alert.action} →</button></div></div></div>)}</div>
            </article>
          </div>

          <article className="mt-5 overflow-hidden rounded-3xl border border-[#dce2dc] bg-white shadow-[0_12px_40px_rgba(29,49,38,.04)]">
            <div className="flex items-center justify-between px-5 py-4"><div><h2 className="font-semibold">Active journeys</h2><p className="text-xs text-[#68756d]">Live progress and source confidence</p></div><button className="text-xs font-semibold text-[#c45530]">View all →</button></div>
            <div className="divide-y divide-[#e7ebe7]">{trips.map((trip) => <div key={trip.vehicle} className="grid gap-3 px-5 py-4 md:grid-cols-[110px_minmax(200px,1fr)_140px_100px] md:items-center"><div><p className="font-semibold">{trip.vehicle}</p><p className="text-xs text-[#68756d]">{trip.status}</p></div><div><div className="flex justify-between gap-3 text-sm"><span className="truncate">{trip.route}</span><span className="font-semibold">{trip.progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e7ebe7]"><div className="h-full rounded-full bg-[#e56a3d]" style={{ width: `${trip.progress}%` }} /></div></div><div><p className="text-xs text-[#68756d]">Estimated arrival</p><p className="text-sm font-semibold">{trip.eta}</p></div><span className="w-fit rounded-full bg-[#e8f2ec] px-2.5 py-1 text-xs font-semibold text-[#315d47]">● {trip.source}</span></div>)}</div>
          </article>
        </section>
      </div>
    </main>
  );
}
