import Image from 'next/image';
import Link from 'next/link';
import FleetMap from '@/components/fleet-map';

export const metadata = { title: 'Vehicle Map — Starlink Fleet System', description: 'Live map of all available fleet vehicles.' };

export default function MapPage() {
  return <main className="min-h-screen bg-[#f4f6f2] text-[#17211b]">
    <header className="border-b border-[#dce2dc] bg-[#fbfcf9] px-4 py-3 lg:px-8"><div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4"><Link href="/" className="flex items-center gap-3"><span className="grid size-14 place-items-center overflow-hidden rounded-xl border border-[#eadedb] bg-white p-1 shadow-sm"><Image className="size-full object-contain" src="/starlink-logo.png" width={56} height={56} alt="Starlink Gulf Trading Ltd logo" priority /></span><span><span className="block font-semibold">Starlink Fleet System</span><span className="block text-xs text-[#68756d]">Fleet movement control</span></span></Link><nav className="flex items-center gap-2 text-sm"><Link className="rounded-xl px-4 py-2.5 font-medium text-[#59665e] hover:bg-white" href="/">Overview</Link><span className="rounded-xl bg-[#8f1712] px-4 py-2.5 font-semibold text-white">Map mode</span></nav></div></header>
    <FleetMap />
  </main>;
}
