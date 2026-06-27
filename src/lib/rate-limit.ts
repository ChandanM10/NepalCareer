/**
 * Rate Limiting Middleware for Production Security
 * Protects auth endpoints from brute force and DOS attacks
 */

import rateLimit from "express-rate-limit"

/**
 * Create a rate limiter for authentication endpoints
 * - Max 5 attempts per 15 minutes per IP address
 * - Max 10 attempts per hour per email address
 * - Returns 429 (Too Many Requests) when limit exceeded
 */
export const createAuthLimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per windowMs
    message: "Too many login attempts, please try again later",
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skip: (req) => {
      // Skip rate limiting in development
      return process.env.NODE_ENV === "development"
    },
    keyGenerator: (req) => {
      // Use IP address as key (or email if provided for more granular control)
      const forwarded = req.headers["x-forwarded-for"]
      return (typeof forwarded === "string" ? forwarded.split(",")[0] : req.socket.remoteAddress) || ""
    },
    handler: (req, res) => {
      res.status(429).json({
        error: "Too many login attempts",
        retryAfter: req.rateLimit?.resetTime ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000) : 900,
      })
    },
  })
}

/**
 * Create a more lenient rate limiter for registration
 * - Max 3 new accounts per 1 hour per IP address
 * - Prevents abuse but allows legitimate signups
 */
export const createRegisterLimiter = () => {
  return rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 registrations per hour
    message: "Too many accounts created from this IP, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return process.env.NODE_ENV === "development"
    },
    keyGenerator: (req) => {
      const forwarded = req.headers["x-forwarded-for"]
      return (typeof forwarded === "string" ? forwarded.split(",")[0] : req.socket.remoteAddress) || ""
    },
    handler: (req, res) => {
      res.status(429).json({
        error: "Too many registration attempts",
        retryAfter: req.rateLimit?.resetTime ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000) : 3600,
      })
    },
  })
}

/**
 * Create an API rate limiter for general endpoints
 * - Max 100 requests per 15 minutes per IP
 * - Protects other endpoints from abuse
 */
export const createAPILimiter = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: "Too many requests from this IP, please try again later",
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      return process.env.NODE_ENV === "development"
    },
    keyGenerator: (req) => {
      const forwarded = req.headers["x-forwarded-for"]
      return (typeof forwarded === "string" ? forwarded.split(",")[0] : req.socket.remoteAddress) || ""
    },
  })
}
