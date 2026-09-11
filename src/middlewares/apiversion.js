export var apiVersion = function (req, res, next) {
  res.set("API-Version", global.config.api.version);
  res.set("Access-Control-Expose-Headers", "API-Version");

  next();
};

export default apiVersion;
