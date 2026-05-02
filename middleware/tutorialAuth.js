const jwt = require("jsonwebtoken");

function tutorialAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const devRole = req.headers["x-dev-role"];
  const devUserId = req.headers["x-dev-userid"] || "dev-user";
  const jwtSecret = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET_KEY;

  // JWT mode
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    try {
      if (!jwtSecret) {
        return res.status(500).json({ success: false, error: { message: "JWT secret is not configured" } });
      }

      const payload = jwt.verify(token, jwtSecret);
      const role = payload.role || payload.userRole || payload.roles;
      const id = payload.sub || payload.id || payload.userId || "unknown";

      if (!role) {
        return res.status(401).json({ success: false, error: { message: "JWT missing role" } });
      }

      req.user = { id, role: String(role).toLowerCase() };
      return next();
    } catch (e) {
      return res.status(401).json({ success: false, error: { message: "Invalid token" } });
    }
  }

  // DEV mode (for Postman before auth component is ready)
  if (devRole) {
    const role = String(devRole).toLowerCase();
    if (role !== "admin" && role !== "student") {
      return res.status(401).json({ success: false, error: { message: "x-dev-role must be admin or student" } });
    }
    req.user = { id: devUserId, role };
    return next();
  }

  return res.status(401).json({
    success: false,
    error: { message: "Unauthorized: provide Bearer token or x-dev-role" },
  });
}

function tutorialAuthorizeRole(...allowed) {
  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(401).json({ success: false, error: { message: "Unauthorized" } });
    }
    if (!allowed.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: { message: "Forbidden" } });
    }
    next();
  };
}

module.exports = { tutorialAuthenticate, tutorialAuthorizeRole };
