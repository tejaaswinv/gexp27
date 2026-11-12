import { NextRequest,NextResponse } from 'next/server';
import { profileSchema } from '@/lib/schema';
import { generateAnalysis } from '@/lib/recommend';
export const runtime='nodejs';
// Higher than the bounded upstream AI budget; allows graceful rules-based recovery.
export const maxDuration=45;
export async function POST(req:NextRequest){
 try{
  const body=await req.json();const parsed=profileSchema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:'Please check the student details.',details:parsed.error.flatten()},{status:400});
  const rulesOnly=req.nextUrl.searchParams.get('mode')==='rules';
  return NextResponse.json(await generateAnalysis(parsed.data,{rulesOnly}),{headers:{'Cache-Control':'no-store'}});
 }catch(err){return NextResponse.json({error:err instanceof Error?err.message:'Analysis unavailable'},{status:500});}
}
