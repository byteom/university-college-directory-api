import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import universityRoutes from "./routes/universities.js";
import collegeRoutes from "./routes/colleges.js";
import { generalLimiter } from "./middleware/rateLimiter.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Large limit for bulk imports
app.use(express.urlencoded({ extended: true }));

// Serve examples folder as static files
import path from "path";
// handle ESM __dirname equivalent if needed, but relative path usually works in process.cwd context
app.use("/examples", express.static("examples"));

// Apply general rate limiter to all routes (100 req/min fallback)
app.use(generalLimiter);

// Health check endpoint (not rate limited beyond general limiter)
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "College API is running!",
    version: "1.0.0",
    endpoints: {
      universities: "/api/universities",
      colleges: "/api/colleges",
    },
    rateLimits: {
      read: "200 requests/minute",
      write: "30 requests/minute",
      bulk: "5 requests/minute",
      delete: "20 requests/minute",
      search: "50 requests/minute",
    },
  });
});

// API Routes
app.use("/api/universities", universityRoutes);
app.use("/api/colleges", collegeRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
  });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Server error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
});

// Start server only if not running in Vercel/Serverless environment
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API Documentation:`);
    console.log(`   - Universities: http://localhost:${PORT}/api/universities`);
    console.log(`   - Colleges: http://localhost:${PORT}/api/colleges`);
    console.log(`\nRate Limits:`);
    console.log(`   - Read: 200 req/min`);
    console.log(`   - Write: 30 req/min`);
    console.log(`   - Bulk: 5 req/min`);
    console.log(`   - Delete: 20 req/min`);
    console.log(`   - Search: 50 req/min`);
  });
}

export default app;
