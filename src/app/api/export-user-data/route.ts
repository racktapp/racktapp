import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { exportUserDataAction } from '@/lib/actions';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    if (!userId) {
        return new NextResponse('Missing userId', { status: 400 });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const token = authHeader.split('Bearer ')[1];
        const decoded = await adminAuth.verifyIdToken(token);
        if (decoded.uid !== userId) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const data = await exportUserDataAction(userId);
        return new NextResponse(JSON.stringify(data), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="user-data-${userId}.json"`,
            },
        });
    } catch (error) {
        console.error('Error exporting user data:', error);
        return new NextResponse('Unauthorized', { status: 401 });
    }
}

