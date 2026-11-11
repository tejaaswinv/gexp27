import catalogJson from '@/data/catalog.json';
import { Course, University } from './types';
export const universities: University[] = catalogJson.universities as University[];
export const courses: Course[] = catalogJson.courses as Course[];
export const catalogMeta = { name:catalogJson.dataset, updated:catalogJson.sourceUpdated, universityCount:universities.length, mappingCount:courses.length };
const courseIndex = new Map<string, Course[]>();
for (const course of courses) {
  const key = course.university.toLowerCase().trim();
  const existing=courseIndex.get(key);
  if(existing) existing.push(course); else courseIndex.set(key,[course]);
}
export function coursesFor(name:string):Course[] { return courseIndex.get(name.toLowerCase().trim()) || []; }
