'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { LiveVehicle } from '@/lib/live-vehicles';
import type { ProviderHealth } from '@/lib/providers';

interface LiveResponse { vehicles: LiveVehicle[]; providers: ProviderHealth[]; generatedAt: string }
interface FleetGroup { id: string; name: string; parentId: string | null; source: 'cmsv6' | 'local' }

const freshness = (iso: string) => {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
const markerColor = (vehicle: LiveVehicle) => vehicle.verification === 'conflict' ? '#dc2626' : vehicle.verification === 'stale' ? '#64748b' : vehicle.speedKph && vehicle.speedKph > 2 ? '#15803d' : '#d97706';

export default function FleetMap() {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<import('leaflet').Map | null>(null);
  const markerLayer = useRef<import('leaflet').MarkerClusterGroup | null>(null);
  const [data, setData] = useState<LiveResponse>({ vehicles: [], providers: [], generatedAt: '' });
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<FleetGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [newGroup, setNewGroup] = useState('');
  const [parentGroup, setParentGroup] = useState('');
  const visible = useMemo(() => data.vehicles.filter((vehicle) => vehicle.registration.toLowerCase().includes(query.toLowerCase()) && (selectedGroup === 'all' || (selectedGroup === 'ungrouped' ? !vehicle.groupId : vehicle.groupId === selectedGroup))), [data.vehicles, query, selectedGroup]);

  const refresh = async () => {
    try {
      const [response, groupResponse] = await Promise.all([fetch('/api/vehicles/live', { cache: 'no-store' }), fetch('/api/groups', { cache: 'no-store' })]);
      if (!response.ok || !groupResponse.ok) throw new Error('Unable to load vehicles');
      setData(await response.json() as LiveResponse);
      setGroups(((await groupResponse.json()) as { groups: FleetGroup[] }).groups);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); const timer = window.setInterval(refresh, 30_000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    if (!mapElement.current || mapInstance.current) return;
    let cancelled = false;
    Promise.all([import('leaflet'), import('leaflet.markercluster')]).then(([L]) => {
      if (cancelled || !mapElement.current) return;
      const map = L.map(mapElement.current, { zoomControl: true }).setView([-6.4, 35.0], 6);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap contributors' }).addTo(map);
      markerLayer.current = L.markerClusterGroup({ showCoverageOnHover: false, spiderfyOnMaxZoom: true, maxClusterRadius: 55, iconCreateFunction: (cluster) => L.divIcon({ className: 'fleet-cluster-wrap', html: `<span class="fleet-cluster">${cluster.getChildCount()}</span>`, iconSize: [46, 46] }) }).addTo(map);
      mapInstance.current = map;
    });
    return () => { cancelled = true; mapInstance.current?.remove(); mapInstance.current = null; };
  }, []);

  useEffect(() => {
    const draw = async () => {
      const L = await import('leaflet');
      const layer = markerLayer.current;
      const map = mapInstance.current;
      if (!layer || !map) return;
      layer.clearLayers();
      const bounds: [number, number][] = [];
      for (const vehicle of visible) {
        const color = markerColor(vehicle);
        const size = selected === vehicle.id ? 48 : 40;
        const heading = Number.isFinite(vehicle.heading) ? vehicle.heading! - 90 : 0;
        const icon = L.divIcon({
          className: 'helion-vehicle-marker',
          html: `<span class="helion-vehicle-art" style="width:${size}px;height:${size}px;transform:rotate(${heading}deg)"><img src="/vehicle-icons/helion-truck.jpg" alt=""><i style="background:${color}"></i></span>`,
          iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2],
        });
        const marker = L.marker([vehicle.latitude, vehicle.longitude], { icon, zIndexOffset: selected === vehicle.id ? 1000 : 0 })
          .bindTooltip(vehicle.registration, { permanent: selected === vehicle.id, direction: 'top', offset: [0, -8] })
          .bindPopup(`<strong>${escapeHtml(vehicle.registration)}</strong><br>${vehicle.speedKph ?? 0} km/h · ${vehicle.verification.replace('_', ' ')}<br>Updated ${freshness(vehicle.gpsRecordedAt)}`)
          .on('click', () => setSelected(vehicle.id));
        layer.addLayer(marker); bounds.push([vehicle.latitude, vehicle.longitude]);
      }
      if (bounds.length && !selected) map.fitBounds(bounds, { padding: [45, 45], maxZoom: 14 });
      const active = data.vehicles.find((vehicle) => vehicle.id === selected);
      if (active) map.setView([active.latitude, active.longitude], Math.max(map.getZoom(), 14));
    };
    draw();
  }, [visible, selected, data.vehicles]);

  const assign = async (vehicleId: string, groupId: string) => { await fetch('/api/groups/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vehicleId, groupId }) }); await refresh(); };
  const addGroup = async () => { if (!newGroup.trim()) return; await fetch('/api/groups', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newGroup, parentId: parentGroup || null }) }); setNewGroup(''); setParentGroup(''); await refresh(); };

  return <div className="grid min-h-[calc(100vh-89px)] lg:grid-cols-[340px_minmax(0,1fr)]">
    <aside className="z-10 border-r border-[#dce2dc] bg-white p-4 lg:p-5">
      <div className="flex items-center justify-between"><div><h1 className="text-xl font-semibold">All vehicles</h1><p className="text-xs text-[#68756d]">Live position map · refreshes every 30 sec</p></div><button onClick={refresh} className="rounded-lg border border-[#dce2dc] px-3 py-2 text-xs font-semibold">Refresh</button></div>
      <div className="mt-4 grid grid-cols-2 gap-2">{data.providers.map((provider) => <div key={provider.provider} className="rounded-xl bg-[#f4f6f2] p-3"><p className="text-xs font-semibold uppercase tracking-wide">{provider.provider === 'cmsv6' ? 'Primary GPS' : 'Secondary GPS'}</p><p className={`mt-1 text-xs ${provider.ok ? 'text-emerald-700' : 'text-amber-700'}`}>{provider.ok ? `● Live · ${provider.vehicleCount}` : provider.message}</p></div>)}</div>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search registration" className="mt-4 w-full rounded-xl border border-[#dce2dc] bg-[#fbfcf9] px-4 py-3 text-sm outline-none focus:border-[#8f1712]" />
      <select value={selectedGroup} onChange={(event) => setSelectedGroup(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dce2dc] bg-white px-3 py-2.5 text-sm"><option value="all">All groups</option>{groups.filter((group) => !group.parentId).map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}{groups.filter((group) => group.parentId).map((group) => <option key={group.id} value={group.id}>↳ {group.name}</option>)}<option value="ungrouped">Ungrouped</option></select>
      <details className="mt-2 rounded-xl border border-[#e4e8e3] bg-[#fbfcf9] p-3"><summary className="cursor-pointer text-xs font-semibold">Create group or subgroup</summary><input value={newGroup} onChange={(event) => setNewGroup(event.target.value)} placeholder="Group name" className="mt-3 w-full rounded-lg border border-[#dce2dc] px-3 py-2 text-xs" /><select value={parentGroup} onChange={(event) => setParentGroup(event.target.value)} className="mt-2 w-full rounded-lg border border-[#dce2dc] px-3 py-2 text-xs"><option value="">Top-level group</option>{groups.filter((group) => !group.parentId).map((group) => <option key={group.id} value={group.id}>Under {group.name}</option>)}</select><button onClick={addGroup} className="mt-2 w-full rounded-lg bg-[#173f35] px-3 py-2 text-xs font-semibold text-white">Add group</button></details>
      <div className="mt-3 max-h-[calc(100vh-270px)] space-y-2 overflow-y-auto pr-1">
        {loading && <p className="p-4 text-sm text-[#68756d]">Loading live vehicles…</p>}
        {!loading && visible.length === 0 && <div className="rounded-2xl border border-dashed border-[#cfd7cf] p-5 text-sm text-[#68756d]"><p className="font-semibold text-[#17211b]">No live vehicles available</p><p className="mt-2">Configure restricted provider credentials to load the real fleet. No sample markers are shown in Map mode.</p></div>}
        {visible.map((vehicle) => <div key={vehicle.id} className={`w-full rounded-2xl border p-4 text-left ${selected === vehicle.id ? 'border-[#8f1712] bg-[#fff7f5]' : 'border-[#e4e8e3] hover:bg-[#f8faf7]'}`}><button onClick={() => setSelected(vehicle.id)} className="w-full text-left"><div className="flex items-center justify-between"><span className="font-semibold">{vehicle.registration}</span><span className={`size-2.5 rounded-full ${vehicle.verification === 'conflict' ? 'bg-red-500' : vehicle.verification === 'stale' ? 'bg-slate-400' : 'bg-emerald-500'}`} /></div><div className="mt-2 flex justify-between text-xs text-[#68756d]"><span>{vehicle.speedKph ?? 0} km/h</span><span>{freshness(vehicle.gpsRecordedAt)}</span></div><p className="mt-2 text-xs font-medium capitalize text-[#496354]">{vehicle.verification.replace('_', ' ')}</p></button><select aria-label={`Group for ${vehicle.registration}`} value={vehicle.groupId ?? ''} onChange={(event) => assign(vehicle.id, event.target.value)} className="mt-3 w-full rounded-lg border border-[#dce2dc] bg-white px-2 py-1.5 text-xs"><option value="" disabled>Move to group…</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.parentId ? '↳ ' : ''}{group.name}</option>)}</select></div>)}
      </div>
    </aside>
    <div className="relative min-h-[560px]"><div ref={mapElement} className="absolute inset-0" /><div className="pointer-events-none absolute bottom-4 right-4 z-[500] rounded-xl bg-white/95 px-3 py-2 text-xs text-[#59665e] shadow-lg">Green moving · Amber stopped · Red conflict · Grey stale</div></div>
  </div>;
}
