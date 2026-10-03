import { assignVehicle } from '@/lib/fleet-store';

export async function POST(request: Request) {
  const body = await request.json() as { vehicleId?: string; groupId?: string };
  if (!body.vehicleId || !body.groupId) return Response.json({ error: 'Vehicle and group are required' }, { status: 400 });
  await assignVehicle(body.vehicleId, body.groupId);
  return Response.json({ ok: true });
}
