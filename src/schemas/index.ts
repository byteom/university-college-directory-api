import { z } from "zod";

// common query schema for pagination and search
export const querySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
  search: z.string().optional(),
  state: z.string().optional(),
  district: z.string().optional(),
});

// university schemas
export const createUniversitySchema = z.object({
  aisheCode: z.string().min(1, "AISHE Code is required"),
  name: z.string().min(1, "Name is required"),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  website: z.string().optional().nullable(),
  yearOfEstablishment: z.number().or(z.string().transform((val) => parseInt(val))).optional().nullable(),
  location: z.string().optional().nullable(),
});

export const updateUniversitySchema = createUniversitySchema.partial();

export const bulkCreateUniversitySchema = z.object({
  universities: z.array(createUniversitySchema).min(1, "At least one university is required"),
});

// college schemas
export const createCollegeSchema = z.object({
  aisheCode: z.string().min(1, "AISHE Code is required"),
  name: z.string().min(1, "Name is required"),
  state: z.string().min(1, "State is required"),
  district: z.string().min(1, "District is required"),
  website: z.string().optional().nullable(),
  yearOfEstablishment: z.number().or(z.string().transform((val) => parseInt(val))).optional().nullable(),
  location: z.string().optional().nullable(),
  collegeType: z.string().optional().nullable(),
  management: z.string().optional().nullable(),
  universityAisheCode: z.string().optional().nullable(),
  universityName: z.string().optional().nullable(),
  universityType: z.string().optional().nullable(),
  universityId: z.string().optional().nullable(),
});

export const updateCollegeSchema = createCollegeSchema.partial();

export const bulkCreateCollegeSchema = z.object({
  colleges: z.array(createCollegeSchema).min(1, "At least one college is required"),
});

// specific query schemas requiring more fields
export const collegeQuerySchema = querySchema.extend({
  collegeType: z.string().optional(),
  management: z.string().optional(),
  universityId: z.string().optional(),
  universityName: z.string().optional(),
});
