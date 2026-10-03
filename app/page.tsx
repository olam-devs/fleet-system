import Image from 'next/image';
import Link from 'next/link';
import LiveDashboard from '@/components/live-dashboard';

export default function Home() {
  return <main className="min-h-screen bg-[#f4f6f2] text-[#17211b]">
    <header className="border-b border-[#dce2dc] bg-[#fbfcf9] px-4 py-4 lg:px-8">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-xl border border-[#eadedb] bg-white p-1 shadow-sm"><Image className="size-full object-contain" src="/starlink-logo.png" width={56} height={56} alt="Starlink Gulf Trading Ltd logo" priority /></span>
          <span><span className="block font-semibold leading-tight">Starlink Fleet System</span><span className="block text-xs text-[#68756d]">Fleet movement control</span></span>
        </Link>
        <Link href="/map" className="rounded-xl bg-[#8f1712] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#74130f]">Open map mode</Link>
      </div>
    </header>
    <LiveDashboard />
  </main>;
}
