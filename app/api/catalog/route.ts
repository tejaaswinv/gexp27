import { NextResponse } from 'next/server';
import { universities,catalogMeta } from '@/lib/catalog';
export function GET(){return NextResponse.json({universities,meta:catalogMeta});}
