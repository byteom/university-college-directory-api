import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { 
  createUniversitySchema, 
  updateUniversitySchema, 
  bulkCreateUniversitySchema,
  querySchema 
} from "../schemas/index.js";

// university controller for business logic
export class UniversityController {
  
  // get all universities with pagination
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      // validate query params using zod
      const result = querySchema.safeParse(req.query);
      
      if (!result.success) {
         res.status(400).json({ success: false, error: result.error.format() });
         return;
      }

      const { page, limit, search, state, district } = result.data;
      const skip = (page - 1) * limit;

      const where: any = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { aisheCode: { contains: search, mode: "insensitive" } },
        ];
      }

      if (state) {
        where.state = { equals: state, mode: "insensitive" };
      }

      if (district) {
        where.district = { equals: district, mode: "insensitive" };
      }

      const [universities, total] = await Promise.all([
        prisma.university.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { colleges: true },
            },
          },
        }),
        prisma.university.count({ where }),
      ]);

      res.json({
        success: true,
        data: universities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching universities:", error);
      res.status(500).json({ success: false, error: "Failed to fetch universities" });
    }
  }

  // get list of states
  static async getStates(_req: Request, res: Response): Promise<void> {
    try {
      const states = await prisma.university.findMany({
        select: { state: true },
        distinct: ["state"],
        orderBy: { state: "asc" },
      });

      res.json({
        success: true,
        data: states.map((s: { state: string }) => s.state),
      });
    } catch (error) {
      console.error("Error fetching states:", error);
      res.status(500).json({ success: false, error: "Failed to fetch states" });
    }
  }

  // get only university names
  static async getNames(req: Request, res: Response): Promise<void> {
    try {
      const result = querySchema.safeParse(req.query);
      if (!result.success) {
        res.status(400).json({ success: false, error: result.error.format() });
        return;
      }
      
      const { search, limit } = result.data;
      const where: any = {};
      
      if (search) {
        where.name = { contains: search, mode: "insensitive" };
      }

      const universities = await prisma.university.findMany({
        where,
        select: {
          id: true,
          aisheCode: true,
          name: true,
        },
        take: limit,
        orderBy: { name: "asc" },
      });

      res.json({
        success: true,
        data: universities,
        count: universities.length,
      });
    } catch (error) {
      console.error("Error fetching university names:", error);
      res.status(500).json({ success: false, error: "Failed to fetch university names" });
    }
  }

  // find colleges by university name
  static async getCollegesByUniversityName(req: Request, res: Response): Promise<void> {
    try {
      const { name } = req.params;
      const result = querySchema.safeParse(req.query);
      
      if (!result.success) {
        res.status(400).json({ success: false, error: result.error.format() });
        return;
      }

      const { page, limit } = result.data;
      const skip = (page - 1) * limit;

      if (!name) {
        res.status(400).json({ success: false, error: "University name is required" });
        return;
      }

      const [colleges, total] = await Promise.all([
        prisma.college.findMany({
          where: {
            universityName: { contains: name, mode: "insensitive" },
          },
          select: {
            id: true,
            aisheCode: true,
            name: true,
            state: true,
            district: true,
            collegeType: true,
            universityName: true,
          },
          skip,
          take: limit,
          orderBy: { name: "asc" },
        }),
        prisma.college.count({
          where: {
            universityName: { contains: name, mode: "insensitive" },
          },
        }),
      ]);

      res.json({
        success: true,
        data: colleges,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching colleges by university name:", error);
      res.status(500).json({ success: false, error: "Failed to fetch colleges" });
    }
  }

  // get university by id
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const university = await prisma.university.findUnique({
        where: { id },
        include: {
          colleges: {
            orderBy: { name: "asc" },
          },
        },
      });

      if (!university) {
        res.status(404).json({ success: false, error: "University not found" });
        return;
      }

      res.json({ success: true, data: university });
    } catch (error) {
      console.error("Error fetching university:", error);
      res.status(500).json({ success: false, error: "Failed to fetch university" });
    }
  }

  // get university by aishe code
  static async getByAisheCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      const university = await prisma.university.findUnique({
        where: { aisheCode: code },
        include: {
          colleges: {
            orderBy: { name: "asc" },
          },
        },
      });

      if (!university) {
        res.status(404).json({ success: false, error: "University not found" });
        return;
      }

      res.json({ success: true, data: university });
    } catch (error) {
      console.error("Error fetching university:", error);
      res.status(500).json({ success: false, error: "Failed to fetch university" });
    }
  }

  // create a new university
  static async create(req: Request, res: Response): Promise<void> {
    try {
      // validate request body with passed zod schema
      const result = createUniversitySchema.safeParse(req.body);

      if (!result.success) {
        res.status(400).json({ success: false, error: result.error.format() });
        return;
      }

      const { aisheCode, name, state, district, website, yearOfEstablishment, location } = result.data;

      const university = await prisma.university.create({
        data: {
          aisheCode,
          name,
          state,
          district,
          website: website ?? null,
          yearOfEstablishment: yearOfEstablishment ?? null,
          location: location ?? null,
        },
      });

      res.status(201).json({ success: true, data: university });
    } catch (error: any) {
      console.error("Error creating university:", error);
      if (error.code === "P2002") {
        res.status(409).json({ success: false, error: "University with this AISHE code already exists" });
        return;
      }
      res.status(500).json({ success: false, error: "Failed to create university" });
    }
  }

  // bulk create universities
  static async bulkCreate(req: Request, res: Response): Promise<void> {
    try {
      const result = bulkCreateUniversitySchema.safeParse(req.body);

      if (!result.success) {
        res.status(400).json({ success: false, error: result.error.format() });
        return;
      }

      const { universities } = result.data;

      const dbData = universities.map((u) => ({
        aisheCode: u.aisheCode,
        name: u.name,
        state: u.state,
        district: u.district,
        website: u.website ?? null,
        yearOfEstablishment: u.yearOfEstablishment ?? null,
        location: u.location ?? null,
      }));

      const dbResult = await prisma.university.createMany({
        data: dbData,
        skipDuplicates: true,
      });

      res.status(201).json({
        success: true,
        message: `Successfully created ${dbResult.count} universities`,
        count: dbResult.count,
      });
    } catch (error) {
      console.error("Error bulk creating universities:", error);
      res.status(500).json({ success: false, error: "Failed to bulk create universities" });
    }
  }

  // update university details
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = updateUniversitySchema.safeParse(req.body);

      if (!result.success) {
        res.status(400).json({ success: false, error: result.error.format() });
        return;
      }

      const university = await prisma.university.update({
        where: { id },
        data: {
           ...result.data,
           // handle nulls explicitly if needed, but zod partial usually allows undefined to skip
        },
      });

      res.json({ success: true, data: university });
    } catch (error: any) {
      console.error("Error updating university:", error);
      if (error.code === "P2025") {
        res.status(404).json({ success: false, error: "University not found" });
        return;
      }
      res.status(500).json({ success: false, error: "Failed to update university" });
    }
  }

  // delete university
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await prisma.university.delete({
        where: { id },
      });

      res.json({ success: true, message: "University deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting university:", error);
      if (error.code === "P2025") {
        res.status(404).json({ success: false, error: "University not found" });
        return;
      }
      res.status(500).json({ success: false, error: "Failed to delete university" });
    }
  }
}
