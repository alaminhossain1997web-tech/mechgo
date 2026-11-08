const allowRiderOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized request",
    });
  }

  if (!["Rider", "admin"].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: "Access denied. Rider or Admin account required.",
    });
  }

  return next();
};

module.exports = allowRiderOrAdmin;
