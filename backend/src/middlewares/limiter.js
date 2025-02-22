import { rateLimit } from "express-rate-limit";

export const limiter = rateLimit({
    windowMs: 1 * 1000, // 1 second window
    limit: 5, // each IP can make up to 10 requests per `windowsMs` (5 minutes)
    standardHeaders: true, // add the `RateLimit-*` headers to the response
    legacyHeaders: false, // remove the `X-RateLimit-*` headers from the response
    message: 'You have exceeded the rate limit. Please try again later.'
  });
  