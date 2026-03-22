import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/data/supabase';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ datasetId: string }> }
) {
  const { datasetId } = await params;
  const supabase = createServerClient();

  const [{ data: dataset }, { data: measurements }] = await Promise.all([
    supabase.from('datasets').select('*').eq('id', datasetId).single(),
    supabase
      .from('measurements')
      .select('*')
      .eq('dataset_id', datasetId)
      .order('biopila_id')
      .order('tiempo_dias'),
  ]);

  if (!dataset) {
    return NextResponse.json({ error: 'Dataset no encontrado' }, { status: 404 });
  }

  return NextResponse.json({ dataset, measurements });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ datasetId: string }> }
) {
  const { datasetId } = await params;
  const supabase = createServerClient();

  const { error } = await supabase
    .from('datasets')
    .delete()
    .eq('id', datasetId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
