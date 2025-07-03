import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, getUserApiKeys, updateUserApiKeys } from '@/lib/auth/server';
import { validateApiKeys } from '@/lib/ai-client';

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

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { openrouterApiKey, openaiApiKey } = await request.json();

    // Validate the keys
    const validation = validateApiKeys({ openrouterApiKey, openaiApiKey });
    if (!validation.isValid) {
      return NextResponse.json({ 
        error: 'Invalid API keys',
        details: validation.errors 
      }, { status: 400 });
    }

    // Only update non-masked values (actual keys, not display values)
    const updates: { openrouterApiKey?: string; openaiApiKey?: string } = {};
    
    if (openrouterApiKey && !openrouterApiKey.includes('*')) {
      updates.openrouterApiKey = openrouterApiKey;
    }
    
    if (openaiApiKey && !openaiApiKey.includes('*')) {
      updates.openaiApiKey = openaiApiKey;
    }

    if (Object.keys(updates).length > 0) {
      await updateUserApiKeys(updates.openrouterApiKey, updates.openaiApiKey);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating API keys:', error);
    return NextResponse.json({ error: 'Failed to update API keys' }, { status: 500 });
  }
}