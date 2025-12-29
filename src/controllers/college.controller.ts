import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { 
  createCollegeSchema, 
  updateCollegeSchema, 
  bulkCreateCollegeSchema,
  collegeQuerySchema,
  querySchema
} from "../schemas/index.js";

// college controller to handle business logic
export class CollegeController {
  
  // get all colleges with filtering and pagination
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      const result = collegeQuerySchema.safeParse(req.query);

      if (!result.success) {
        res.status(400).json({ success: false, error: result.error.format() });
        return;
      }

      const { 
        page, limit, search, state, district, 
        collegeType, management, universityId 
      } = result.data;

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

      if (collegeType) {
        where.collegeType = { equals: collegeType, mode: "insensitive" };
      }

      if (management) {
        where.management = { equals: management, mode: "insensitive" };
      }

      if (universityId) {
        where.universityId = universityId;
      }

      const [colleges, total] = await Promise.all([
        prisma.college.findMany({
          where,
          skip,
          take: limit,
          orderBy: { name: "asc" },
          include: {
            university: {
              select: {
                id: true,
                name: true,
                aisheCode: true,
              },
            },
          },
        }),
        prisma.college.count({ where }),
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
      console.error("Error fetching colleges:", error);
      res.status(500).json({ success: false, error: "Failed to fetch colleges" });
    }
  }

  // get unique states
  static async getStates(_req: Request, res: Response): Promise<void> {
    try {
      const states = await prisma.college.findMany({
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

  // get unique college types
  static async getCollegeTypes(_req: Request, res: Response): Promise<void> {
    try {
      const types = await prisma.college.findMany({
        select: { collegeType: true },
        distinct: ["collegeType"],
        where: { collegeType: { not: null } },
        orderBy: { collegeType: "asc" },
      });

      res.json({
        success: true,
        data: types.map((t: { collegeType: string | null }) => t.collegeType).filter(Boolean),
      });
    } catch (error) {
      console.error("Error fetching college types:", error);
      res.status(500).json({ success: false, error: "Failed to fetch college types" });
    }
  }

  // get unique management types
  static async getManagementTypes(_req: Request, res: Response): Promise<void> {
    try {
      const types = await prisma.college.findMany({
        select: { management: true },
        distinct: ["management"],
        where: { management: { not: null } },
        orderBy: { management: "asc" },
      });

      res.json({
        success: true,
        data: types.map((t: { management: string | null }) => t.management).filter(Boolean),
      });
    } catch (error) {
      console.error("Error fetching management types:", error);
      res.status(500).json({ success: false, error: "Failed to fetch management types" });
    }
  }

  // get just college names for searching
  static async getNames(req: Request, res: Response): Promise<void> {
    try {
      const result = collegeQuerySchema.pick({ search: true, limit: true, universityName: true }).safeParse(req.query);
      
      if (!result.success) {
        res.status(400).json({ success: false, error: result.error.format() });
        return;
      }

      const { search, limit, universityName } = result.data;

      const where: any = {};
      if (search) {
        where.name = { contains: search, mode: "insensitive" };
      }
      if (universityName) {
        where.universityName = { contains: universityName, mode: "insensitive" };
      }

      const colleges = await prisma.college.findMany({
        where,
        select: {
          id: true,
          aisheCode: true,
          name: true,
          state: true,
          district: true,
        },
        take: limit,
        orderBy: { name: "asc" },
      });

      res.json({
        success: true,
        data: colleges,
        count: colleges.length,
      });
    } catch (error) {
      console.error("Error fetching college names:", error);
      res.status(500).json({ success: false, error: "Failed to fetch college names" });
    }
  }

  // get college by id
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const college = await prisma.college.findUnique({
        where: { id },
        include: {
          university: true,
        },
      });

      if (!college) {
        res.status(404).json({ success: false, error: "College not found" });
        return;
      }

      res.json({ success: true, data: college });
    } catch (error) {
      console.error("Error fetching college:", error);
      res.status(500).json({ success: false, error: "Failed to fetch college" });
    }
  }

  // get college by aishe code
  static async getByAisheCode(req: Request, res: Response): Promise<void> {
    try {
      const { code } = req.params;

      const college = await prisma.college.findUnique({
        where: { aisheCode: code },
        include: {
          university: true,
        },
      });

      if (!college) {
        res.status(404).json({ success: false, error: "College not found" });
        return;
      }

      res.json({ success: true, data: college });
    } catch (error) {
      console.error("Error fetching college:", error);
      res.status(500).json({ success: false, error: "Failed to fetch college" });
    }
  }

  // create new college
  static async create(req: Request, res: Response): Promise<void> {
    try {
      const result = createCollegeSchema.safeParse(req.body);

      if (!result.success) {
        res.status(400).json({ success: false, error: result.error.format() });
        return;
      }

      const {
        aisheCode, name, state, district, website, yearOfEstablishment,
        location, collegeType, management, universityAisheCode,
        universityName, universityType, universityId
      } = result.data;

      const college = await prisma.college.create({
        data: {
          aisheCode,
          name,
          state,
          district,
          website: website ?? null,
          yearOfEstablishment: yearOfEstablishment ?? null,
          location: location ?? null,
          collegeType: collegeType ?? null,
          management: management ?? null,
          universityAisheCode: universityAisheCode ?? null,
          universityName: universityName ?? null,
          universityType: universityType ?? null,
          universityId: universityId ?? null,
        },
      });

      res.status(201).json({ success: true, data: college });
    } catch (error: any) {
      console.error("Error creating college:", error);
      if (error.code === "P2002") {
        res.status(409).json({ success: false, error: "College with this AISHE code already exists" });
        return;
      }
      res.status(500).json({ success: false, error: "Failed to create college" });
    }
  }

  // bulk create colleges
  static async bulkCreate(req: Request, res: Response): Promise<void> {
    try {
      const result = bulkCreateCollegeSchema.safeParse(req.body);

      if (!result.success) {
        res.status(400).json({ success: false, error: result.error.format() });
        return;
      }

      const { colleges } = result.data;

      const dbData = colleges.map((c) => ({
        aisheCode: c.aisheCode,
        name: c.name,
        state: c.state,
        district: c.district,
        website: c.website ?? null,
        yearOfEstablishment: c.yearOfEstablishment ?? null,
        location: c.location ?? null,
        collegeType: c.collegeType ?? null,
        management: c.management ?? null,
        universityAisheCode: c.universityAisheCode ?? null,
        universityName: c.universityName ?? null,
        universityType: c.universityType ?? null,
        universityId: c.universityId ?? null,
      }));

      const dbResult = await prisma.college.createMany({
        data: dbData,
        skipDuplicates: true,
      });

      res.status(201).json({
        success: true,
        message: `Successfully created ${dbResult.count} colleges`,
        count: dbResult.count,
      });
    } catch (error) {
      console.error("Error bulk creating colleges:", error);
      res.status(500).json({ success: false, error: "Failed to bulk create colleges" });
    }
  }

  // update college details
  static async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = updateCollegeSchema.safeParse(req.body);
      
      if (!result.success) {
         res.status(400).json({ success: false, error: result.error.format() });
         return;
      }

      const college = await prisma.college.update({
        where: { id },
        data: {
          ...result.data,
        },
      });

      res.json({ success: true, data: college });
    } catch (error: any) {
      console.error("Error updating college:", error);
      if (error.code === "P2025") {
        res.status(404).json({ success: false, error: "College not found" });
        return;
      }
      res.status(500).json({ success: false, error: "Failed to update college" });
    }
  }

  // delete college
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await prisma.college.delete({
        where: { id },
      });

      res.json({ success: true, message: "College deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting college:", error);
      if (error.code === "P2025") {
        res.status(404).json({ success: false, error: "College not found" });
        return;
      }
      res.status(500).json({ success: false, error: "Failed to delete college" });
    }
  }
}
