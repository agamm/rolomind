import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, getUserApiKeys } from '@/lib/auth/server';
import { db } from '@/db/sqlite';
import { user } from '@/db/sqlite/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const apiKeys = await getUserApiKeys();
    
    if (!apiKeys) {
      return NextResponse.json({ 
        openrouterApiKey: '',
        openaiApiKey: ''
      });
    }

    // Return the actual keys - they'll be handled securely on the frontend
    return NextResponse.json({
      openrouterApiKey: apiKeys.openrouterApiKey || '',
      openaiApiKey: apiKeys.openaiApiKey || ''
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 });
  }
}

const apiKeySchema = z.object({
  openrouterApiKey: z.string().optional(),
  openaiApiKey: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = apiKeySchema.parse(body);
    
    const updates: { openrouterApiKey?: string | null; openaiApiKey?: string | null } = {};
    
    if (validatedData.openrouterApiKey !== undefined && !validatedData.openrouterApiKey.includes('*')) {
      updates.openrouterApiKey = validatedData.openrouterApiKey.trim() || null;
    }
    
    if (validatedData.openaiApiKey !== undefined && !validatedData.openaiApiKey.includes('*')) {
      updates.openaiApiKey = validatedData.openaiApiKey.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    await db.update(user)
      .set(updates)
      .where(eq(user.id, session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input', details: error.errors }, { status: 400 });
    }
    console.error('Error updating API keys:', error);
    return NextResponse.json({ error: 'Failed to update API keys' }, { status: 500 });
  }
}