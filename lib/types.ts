export type Pillar = 'CSD' | 'DAI' | 'EPD' | 'ESD' | 'ASD';
export type Term = 'fall' | 'spring';
export type University = {
 id: number; name: string; country: string | null; city: string | null;
 minimumGpa: number | null; passportRestrictions: string | null;
 slots: Record<Term,string | number | null>; dates: Record<Term,string | null>;
 pillarRecommendations: Record<string,Record<Term,string | null>>;
 tags?: string[]; highlights?: string; funFacts?: string;
};
export type Course = {
 university: string; exchangeTerm: string | null; pillar: string | null;
 hostCode: string; hostTitle: string; hostCredits: string | number | null;
 sutdCode: string | null; sutdTitle: string | null; sutdCredits: string | number | null;
 level: string | null; hassDiscipline: string | null; remarks: string | null;
 source?: 'reference' | 'manual'; description?: string; sourceUrl?: string;
};
export type StudentProfile = {
 name: string; studentId: string; gpa: number; pillar: Pillar; tracks: string[]; secondMajorHdi: boolean;
 matriculationYear?: number; hdiDomain?: string;
 interests: string; region: string; term: Term; passport: string;
 homePlan: Record<'4'|'5'|'7'|'8', {code:string;title:string}[]>;
};
export type Recommendation = {
 university: University; score: number; reason: string; strengths: string[]; warnings: string[];
 mappings: Course[]; pillarCount: number; hassCount: number; referenceCount: number;
 eligible: boolean; confidence: 'strong' | 'partial' | 'research-needed';
};
export type Analysis = { recommendations:Recommendation[]; mode:'zaoapi'|'rules-based'; model?:string; notices:string[]; generatedAt:string; candidateCount:number };
