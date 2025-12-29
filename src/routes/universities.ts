import { Router } from "express";
import { UniversityController } from "../controllers/university.controller.js";
import {
  readLimiter,
  writeLimiter,
  bulkLimiter,
  deleteLimiter,
  searchLimiter,
} from "../middleware/rateLimiter.js";

const router = Router();

// university routes with rate limiting

// lightweight endpoints
router.get("/names", readLimiter, UniversityController.getNames);
router.get("/search-colleges/:name", searchLimiter, UniversityController.getCollegesByUniversityName);

// filter endpoints
router.get("/states", searchLimiter, UniversityController.getStates);

// main endpoints
router.get("/", readLimiter, UniversityController.getAll);
router.get("/aishe/:code", readLimiter, UniversityController.getByAisheCode);
router.get("/:id", readLimiter, UniversityController.getById);

// write endpoints
router.post("/", writeLimiter, UniversityController.create);
router.post("/bulk", bulkLimiter, UniversityController.bulkCreate);
router.put("/:id", writeLimiter, UniversityController.update);
router.delete("/:id", deleteLimiter, UniversityController.delete);

export default router;
