'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LiveVehicle } from '@/lib/live-vehicles';
import type { ProviderHealth } from '@/lib/providers';

interface LiveResponse { vehicles: LiveVehicle[]; providers: ProviderHealth[]; generatedAt: string }
const freshness = (iso: string) => { const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)); if (minutes < 1) return 'just now'; if (minutes < 60) return `${minutes} min ago`; const hours = Math.floor(minutes / 60); if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`; const days = Math.floor(hours / 24); return `${days} day${days === 1 ? '' : 's'} ago`; };
const markerColor = (vehicle: LiveVehicle) => vehicle.verification === 'conflict' ? '#dc2626' : vehicle.verification === 'stale' ? '#64748b' : vehicle.speedKph && vehicle.speedKph > 2 ? '#15803d' : '#d97706';

export default function LiveDashboard() {
  const [data, setData] = useState<LiveResponse>({ vehicles: [], providers: [], generatedAt: '' });
  const [loading, setLoading] = useState(true);
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import('leaflet').Map | null>(null);
  const markerLayer = useRef<import('leaflet').MarkerClusterGroup | null>(null);
  const refresh = async () => { try { const response = await fetch('/api/vehicles/live', { cache: 'no-store' }); if (!response.ok) throw new Error('Unable to load vehicles'); setData(await response.json() as LiveResponse); } finally { setLoading(false); } };

  useEffect(() => { refresh(); const timer = window.setInterval(refresh, 30_000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    if (!mapElement.current || mapInstance.current) return;
    let cancelled = false;
    Promise.all([import('leaflet'), import('leaflet.markercluster')]).then(([L]) => { if (cancelled || !mapElement.current) return; const map = L.map(mapElement.current, { zoomControl: false }).setView([-6.4, 35], 6); L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map); markerLayer.current = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 55, iconCreateFunction: (cluster) => L.divIcon({ className: 'fleet-cluster-wrap', html: `<span class="fleet-cluster">${cluster.getChildCount()}</span>`, iconSize: [46, 46] }) }).addTo(map); mapInstance.current = map; });
    return () => { cancelled = true; mapInstance.current?.remove(); mapInstance.current = null; };
  }, []);
  useEffect(() => {
    const draw = async () => { const L = await import('leaflet'); const layer = markerLayer.current; const map = mapInstance.current; if (!layer || !map) return; layer.clearLayers(); const bounds: [number, number][] = [];
      for (const vehicle of data.vehicles) { const heading = Number.isFinite(vehicle.heading) ? vehicle.heading! - 90 : 0; const icon = L.divIcon({ className: 'helion-vehicle-marker', html: `<span class="helion-vehicle-art" style="width:34px;height:34px;transform:rotate(${heading}deg)"><img src="/vehicle-icons/helion-truck.jpg" alt=""><i style="background:${markerColor(vehicle)}"></i></span>`, iconSize: [34, 34], iconAnchor: [17, 17] }); L.marker([vehicle.latitude, vehicle.longitude], { icon }).bindTooltip(vehicle.registration).addTo(layer); bounds.push([vehicle.latitude, vehicle.longitude]); }
      if (bounds.length) map.fitBounds(bounds, { padding: [25, 25], maxZoom: 12 }); };
    draw();
  }, [data.vehicles]);

  const metrics = useMemo(() => { const moving = data.vehicles.filter((v) => v.verification !== 'stale' && (v.speedKph ?? 0) > 2).length; const stopped = data.vehicles.filter((v) => v.verification !== 'stale' && (v.speedKph ?? 0) <= 2).length; const attention = data.vehicles.filter((v) => v.verification === 'stale' || v.verification === 'conflict').length; return { total: data.vehicles.length, moving, stopped, attention }; }, [data.vehicles]);
  const attentionVehicles = data.vehicles.filter((v) => v.verification === 'stale' || v.verification === 'conflict').slice(0, 8);
  const recent = [...data.vehicles].sort((a, b) => new Date(b.gpsRecordedAt).getTime() - new Date(a.gpsRecordedAt).getTime()).slice(0, 10);

  return <div className="mx-auto grid max-w-[1500px] gap-5 p-4 lg:grid-cols-[220px_minmax(0,1fr)] lg:p-8">
    <aside className="hidden lg:block"><nav className="space-y-1 text-sm font-medium"><span className="flex items-center gap-3 rounded-xl bg-[#dfeae3] px-4 py-3 text-[#173f35]">▦ Overview</span><Link className="flex rounded-xl px-4 py-3 text-[#59665e] hover:bg-white" href="/map">⌖ All vehicles map</Link></nav><div className="mt-8 rounded-2xl bg-[#173f35] p-4 text-white"><p className="text-xs uppercase tracking-[.14em] text-[#a8c6b9]">Data sources</p>{data.providers.map((provider) => <p key={provider.provider} className="mt-3 text-sm"><span className={provider.ok ? 'text-emerald-300' : 'text-amber-300'}>●</span> {provider.provider === 'cmsv6' ? 'Primary GPS' : 'Secondary GPS'} <strong className="float-right">{provider.vehicleCount}</strong></p>)}</div><div className="mt-4 rounded-2xl border border-[#dce2dc] bg-white p-4 text-xs leading-5 text-[#68756d]">Trip scheduling and workshop management will appear here when their real records are connected.</div></aside>
    <section className="min-w-0">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-sm font-medium text-[#8f1712]">Live fleet position</p><h1 className="mt-1 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Operations at a glance</h1></div><button onClick={refresh} className="rounded-xl border border-[#dce2dc] bg-white px-4 py-2 text-sm font-semibold">{loading ? 'Loading…' : `Refresh · ${data.generatedAt ? freshness(data.generatedAt) : ''}`}</button></div>
      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">{[['Fleet on map', metrics.total, 'Real registered vehicles'], ['Moving', metrics.moving, 'Fresh and above 2 km/h'], ['Stopped', metrics.stopped, 'Fresh and stationary'], ['Needs attention', metrics.attention, 'Stale or conflicting position']].map(([label, value, note]) => <article key={label} className="rounded-2xl border border-[#dce2dc] bg-white p-4 shadow-[0_8px_30px_rgba(29,49,38,.04)]"><p className="text-sm text-[#68756d]">{label}</p><p className="my-2 text-3xl font-semibold tracking-tight">{value}</p><p className="text-xs font-medium text-[#50705e]">{note}</p></article>)}</div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.75fr)]"><article className="overflow-hidden rounded-3xl border border-[#dce2dc] bg-white shadow-[0_12px_40px_rgba(29,49,38,.06)]"><div className="flex items-center justify-between px-5 py-4"><div><h2 className="font-semibold">Live movement</h2><p className="text-xs text-[#68756d]">Combined, verified fleet positions</p></div><Link href="/map" className="rounded-lg border border-[#dce2dc] px-3 py-2 text-xs font-semibold">Open full map</Link></div><div className="relative h-[420px]"><div ref={mapElement} className="absolute inset-0" /></div></article><article className="rounded-3xl border border-[#dce2dc] bg-white p-5 shadow-[0_12px_40px_rgba(29,49,38,.05)]"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">Needs attention</h2><p className="text-xs text-[#68756d]">Location exceptions only</p></div><span className="rounded-full bg-[#fff0e9] px-2.5 py-1 text-xs font-bold text-[#bb4b27]">{metrics.attention}</span></div><div className="max-h-[390px] space-y-3 overflow-y-auto">{attentionVehicles.length === 0 && <p className="rounded-2xl bg-[#f4f6f2] p-4 text-sm text-[#68756d]">No current location exceptions.</p>}{attentionVehicles.map((vehicle) => <div key={vehicle.id} className="rounded-2xl border border-[#e4e8e3] p-4"><div className="flex gap-3"><span className={`mt-1 size-2.5 shrink-0 rounded-full ${vehicle.verification === 'conflict' ? 'bg-red-500' : 'bg-slate-400'}`} /><div><p className="text-sm font-semibold">{vehicle.registration}</p><p className="mt-1 text-xs capitalize text-[#68756d]">{vehicle.verification.replace('_', ' ')} · updated {freshness(vehicle.gpsRecordedAt)}</p></div></div></div>)}</div></article></div>
      <article className="mt-5 overflow-hidden rounded-3xl border border-[#dce2dc] bg-white shadow-[0_12px_40px_rgba(29,49,38,.04)]"><div className="flex items-center justify-between px-5 py-4"><div><h2 className="font-semibold">Latest vehicle updates</h2><p className="text-xs text-[#68756d]">Most recently reported real positions</p></div><Link href="/map" className="text-xs font-semibold text-[#8f1712]">View all →</Link></div><div className="divide-y divide-[#e7ebe7]">{recent.map((vehicle) => <div key={vehicle.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[150px_minmax(180px,1fr)_110px_110px] sm:items-center"><p className="font-semibold">{vehicle.registration}</p><p className="truncate text-sm text-[#59665e]">{vehicle.address || `${vehicle.latitude.toFixed(5)}, ${vehicle.longitude.toFixed(5)}`}</p><p className="text-sm font-semibold">{vehicle.speedKph ?? 0} km/h</p><p className="text-xs capitalize text-[#50705e]">{vehicle.verification.replace('_', ' ')}</p></div>)}</div></article>
    </section>
  </div>;
}
