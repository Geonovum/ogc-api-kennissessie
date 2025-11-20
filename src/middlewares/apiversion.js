export var apiVersion = function (req, res, next) {
  res.set("API-Version", global.config.api.version);

  next();
};

export default apiVersion;
