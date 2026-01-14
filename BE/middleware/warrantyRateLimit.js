// Rate limiting middleware for warranty lookup
const rateLimitMap = new Map();

const WARRANTY_LOOKUP_RATE_LIMIT = {
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 20, // Maximum 20 requests per window
  blockDurationMs: 5 * 60 * 1000 // Block for 5 minutes if exceeded
};

const cleanupExpiredEntries = () => {
  const now = Date.now();
  for (const [key, data] of rateLimitMap.entries()) {
    if (now - data.firstRequest > WARRANTY_LOOKUP_RATE_LIMIT.windowMs) {
      rateLimitMap.delete(key);
    }
  }
};

const getClientIdentifier = (req) => {
  // Use IP address as identifier
  return req.ip || req.connection.remoteAddress || 'unknown';
};

const warrantyRateLimit = (req, res, next) => {
  const clientId = getClientIdentifier(req);
  const now = Date.now();
  
  // Clean up expired entries periodically
  if (Math.random() < 0.1) { // 10% chance to cleanup
    cleanupExpiredEntries();
  }
  
  const clientData = rateLimitMap.get(clientId);
  
  if (!clientData) {
    // First request from this client
    rateLimitMap.set(clientId, {
      firstRequest: now,
      requestCount: 1,
      blockedUntil: null
    });
    return next();
  }
  
  // Check if client is currently blocked
  if (clientData.blockedUntil && now < clientData.blockedUntil) {
    const remainingTime = Math.ceil((clientData.blockedUntil - now) / 60000);
    return res.status(429).json({
      error: `Quá nhiều yêu cầu tra cứu bảo hành. Vui lòng thử lại sau ${remainingTime} phút.`
    });
  }
  
  // Check if window has expired
  if (now - clientData.firstRequest > WARRANTY_LOOKUP_RATE_LIMIT.windowMs) {
    // Reset window
    rateLimitMap.set(clientId, {
      firstRequest: now,
      requestCount: 1,
      blockedUntil: null
    });
    return next();
  }
  
  // Check if limit exceeded
  if (clientData.requestCount >= WARRANTY_LOOKUP_RATE_LIMIT.maxRequests) {
    // Block client
    clientData.blockedUntil = now + WARRANTY_LOOKUP_RATE_LIMIT.blockDurationMs;
    const remainingTime = Math.ceil(WARRANTY_LOOKUP_RATE_LIMIT.blockDurationMs / 60000);
    return res.status(429).json({
      error: `Quá nhiều yêu cầu tra cứu bảo hành. Vui lòng thử lại sau ${remainingTime} phút.`
    });
  }
  
  // Increment request count
  clientData.requestCount++;
  next();
};

// Function to reset rate limit for a specific client (for development)
const resetRateLimit = (clientId) => {
  rateLimitMap.delete(clientId);
};

// Function to clear all rate limits (for development)
const clearAllRateLimits = () => {
  rateLimitMap.clear();
};

module.exports = {
  default: warrantyRateLimit,
  resetRateLimit,
  clearAllRateLimits
};
