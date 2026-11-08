const allowTechnicianOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized request",
    });
  }

  if (!["Technician", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Technician or Admin account required.",
    });
  }

  return next();
};

module.exports = allowTechnicianOrAdmin;
