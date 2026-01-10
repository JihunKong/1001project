import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { DataExportService } from '@/lib/data-export';
import * as fs from 'fs';

const exportService = new DataExportService();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const url = new URL(request.url);
    const download = url.searchParams.get('download') === 'true';

    if (download) {
      try {
        const { filePath, filename } = await exportService.getExportFile(id, session.user.id);

        const fileStream = fs.createReadStream(filePath);
        const chunks: Buffer[] = [];

        for await (const chunk of fileStream) {
          chunks.push(chunk as Buffer);
        }

        const buffer = Buffer.concat(chunks);

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.length.toString(),
          },
        });
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === 'Export has expired') {
            return NextResponse.json({ error: 'Export has expired' }, { status: 410 });
          }
          if (error.message === 'Export file not found or not ready') {
            return NextResponse.json({ error: 'Export not ready' }, { status: 404 });
          }
        }
        throw error;
      }
    }

    const status = await exportService.getExportStatus(id, session.user.id);

    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Export request not found') {
      return NextResponse.json({ error: 'Export request not found' }, { status: 404 });
    }

    console.error('Export status error:', error);
    return NextResponse.json({ error: 'Failed to get export status' }, { status: 500 });
  }
}
