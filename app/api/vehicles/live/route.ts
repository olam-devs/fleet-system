import { mergeProviderVehicles } from '@/lib/live-vehicles';
import { fetchCartrackVehicles, fetchCmsv6Vehicles } from '@/lib/providers';
import { attachGroups } from '@/lib/fleet-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const [cmsv6, cartrack] = await Promise.all([fetchCmsv6Vehicles(), fetchCartrackVehicles()]);
  const vehicles = await attachGroups(mergeProviderVehicles([...cmsv6.vehicles, ...cartrack.vehicles]));
  return Response.json({
    generatedAt: new Date().toISOString(),
    vehicles,
    providers: [cmsv6.health, cartrack.health],
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } });
}
