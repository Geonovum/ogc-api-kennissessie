export var apiVersion = function (req, res, next) {
  res.set("API-Version", global.config.APIVERSION);

  next();
};

export default apiVersion;
