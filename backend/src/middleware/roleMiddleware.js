module.exports = function(requiredRoles = []){
  return (req, res, next) => {
    const role = req.user && req.user.role;
    if (!role) return res.status(403).json({ message: 'Forbidden' });
    if (requiredRoles.length && !requiredRoles.includes(role)) return res.status(403).json({ message: 'Insufficient role' });
    next();
  };
};
