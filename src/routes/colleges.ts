import { Router } from "express";
import { CollegeController } from "../controllers/college.controller.js";
import {
  readLimiter,
  writeLimiter,
  bulkLimiter,
  deleteLimiter,
    searchLimiter,
} from "../middleware/rateLimiter.js";

const router = Router();

// college routes with rate limiting

// lightweight endpoints
router.get("/names", readLimiter, CollegeController.getNames);

// filter endpoints
router.get("/states", searchLimiter, CollegeController.getStates);
router.get("/types", searchLimiter, CollegeController.getCollegeTypes);
router.get("/management-types", searchLimiter, CollegeController.getManagementTypes);

// main endpoints
router.get("/", readLimiter, CollegeController.getAll);
router.get("/aishe/:code", readLimiter, CollegeController.getByAisheCode);
router.get("/:id", readLimiter, CollegeController.getById);

// write endpoints
router.post("/", writeLimiter, CollegeController.create);
router.post("/bulk", bulkLimiter, CollegeController.bulkCreate);
router.put("/:id", writeLimiter, CollegeController.update);
router.delete("/:id", deleteLimiter, CollegeController.delete);

export default router;
