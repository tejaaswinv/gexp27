import { z } from 'zod';
export const homeItem=z.object({code:z.string().max(40), title:z.string().max(160)});
export const profileSchema=z.object({
 name:z.string().trim().min(2).max(100),studentId:z.string().max(25).default(''),
 gpa:z.number().min(0).max(5),pillar:z.enum(['CSD','DAI','EPD','ESD','ASD']),
 tracks:z.array(z.string().max(60)).max(8).default([]), secondMajorHdi:z.boolean(),
 matriculationYear:z.number().int().min(2020).max(2027).default(2025), hdiDomain:z.string().max(60).default(''),
 interests:z.string().max(700).default(''),region:z.string().max(60).default('Any'),
 term:z.enum(['fall','spring']),passport:z.string().max(80).default(''),
 homePlan:z.object({
  '4':z.array(homeItem).max(5),'5':z.array(homeItem).max(5),
  '7':z.array(homeItem).max(5),'8':z.array(homeItem).max(5),
 })
});
export const courseSchema=z.object({
 university:z.string(),exchangeTerm:z.string().nullable(),pillar:z.string().nullable(),
 hostCode:z.string().max(60),hostTitle:z.string().max(200),
 hostCredits:z.union([z.string(),z.number()]).nullable(),
 sutdCode:z.string().nullable(),sutdTitle:z.string().nullable(),
 sutdCredits:z.union([z.string(),z.number()]).nullable(),
 level:z.string().nullable(),hassDiscipline:z.string().nullable(),remarks:z.string().nullable(),
 source:z.enum(['reference','manual']).optional(),description:z.string().max(2000).optional(),sourceUrl:z.string().max(600).optional()
});
export const exportSchema=z.object({
 profile:profileSchema,
 recommendations:z.array(z.object({universityId:z.number(),mappings:z.array(courseSchema).max(16)})).min(1).max(4)
});
