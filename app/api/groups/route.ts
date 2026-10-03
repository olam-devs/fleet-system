import { createGroup, getGroups } from '@/lib/fleet-store';

export const dynamic = 'force-dynamic';
export async function GET() { return Response.json({ groups: await getGroups() }); }
export async function POST(request: Request) {
  const body = await request.json() as { name?: string; parentId?: string | null };
  try { const id = await createGroup(body.name ?? '', body.parentId ?? null); return Response.json({ id, groups: await getGroups() }, { status: 201 }); }
  catch (error) { return Response.json({ error: error instanceof Error ? error.message : 'Unable to create group' }, { status: 400 }); }
}
