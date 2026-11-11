import { NextRequest,NextResponse } from 'next/server';
import { exportSchema } from '@/lib/schema';
import { buildExportPack } from '@/lib/export-pdf';
import { universities,coursesFor } from '@/lib/catalog';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 try{
  const parsed=exportSchema.safeParse(await req.json());
  if(!parsed.success)return NextResponse.json({error:'Invalid export details. Please check your selections.'},{status:400});
  const {profile,recommendations}=parsed.data;
  const seen=new Set<number>();
  for(const r of recommendations){
   if(seen.has(r.universityId))return NextResponse.json({error:'Duplicate universities are not allowed.'},{status:400});
   seen.add(r.universityId);
   const uni=universities.find(u=>u.id===r.universityId);
   if(!uni)return NextResponse.json({error:'Unknown university.'},{status:400});
   const known=coursesFor(uni.name);
   for(const c of r.mappings){
    const found=known.some(x=>x.hostCode===c.hostCode&&x.sutdCode===c.sutdCode);
    if(c.source!=='manual'&&!found)return NextResponse.json({error:`Unverified reference mapping for ${uni.name}: ${c.hostCode}`},{status:400});
   }
  }
  const bytes=await buildExportPack(profile,recommendations);
  return new NextResponse(new Uint8Array(bytes) as unknown as BodyInit,{status:200,headers:{'Content-Type':'application/zip','Content-Disposition':'attachment; filename="GEXP_Atlas_2027_Study_Plans.zip"','Cache-Control':'no-store'}});
 }catch(err){return NextResponse.json({error:err instanceof Error?err.message:'Export failed'},{status:500});}
}
