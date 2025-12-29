import rateLimit from "express-rate-limit";

// Base rate limiter configuration
const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message,
    },
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
  });
};

// General API rate limiter - 100 requests per minute
export const generalLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  100,
  "Too many requests, please try again after a minute"
);

// Read operations - more permissive (200 requests per minute)
export const readLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  200,
  "Too many read requests, please slow down"
);

// Write operations (POST, PUT) - stricter (30 requests per minute)
export const writeLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  30,
  "Too many write requests, please try again later"
);

// Bulk operations - very strict (5 requests per minute)
export const bulkLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  5,
  "Too many bulk operations, please wait before importing more data"
);

// Delete operations - strict (20 requests per minute)
export const deleteLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  20,
  "Too many delete requests, please try again later"
);

// Search operations - moderate (50 requests per minute)
export const searchLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  50,
  "Too many search requests, please try again later"
);
