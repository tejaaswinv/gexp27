import { NextRequest,NextResponse } from 'next/server';
import { profileSchema } from '@/lib/schema';
import { generateAnalysis } from '@/lib/recommend';
export const runtime='nodejs';
export async function POST(req:NextRequest){
 try{
  const body=await req.json();const parsed=profileSchema.safeParse(body);
  if(!parsed.success)return NextResponse.json({error:'Please check the student details.',details:parsed.error.flatten()},{status:400});
  return NextResponse.json(await generateAnalysis(parsed.data),{headers:{'Cache-Control':'no-store'}});
 }catch(err){return NextResponse.json({error:err instanceof Error?err.message:'Analysis unavailable'},{status:500});}
}
