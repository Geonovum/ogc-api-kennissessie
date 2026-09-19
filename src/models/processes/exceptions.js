const NO_SUCH_PROCESS =
  "http://www.opengis.net/def/exceptions/ogcapi-processes-1/1.0/no-such-process";
const NO_SUCH_JOB =
  "http://www.opengis.net/def/exceptions/ogcapi-processes-1/1.0/no-such-job";
const RESULT_NOT_READY =
  "http://www.opengis.net/def/exceptions/ogcapi-processes-1/1.0/result-not-ready";
const INVALID_PARAMETER =
  "http://www.opengis.net/def/exceptions/ogcapi-processes-1/1.0/invalid-parameter";
const SERVER_ERROR =
  "http://www.opengis.net/def/exceptions/ogcapi-processes-1/1.0/server-error";
const NO_SUCH_OUTPUT =
  "http://www.opengis.net/def/exceptions/ogcapi-processes-1/1.0/no-such-output";
const RESULT_NOT_AVAILABLE =
  "http://www.opengis.net/def/exceptions/ogcapi-processes-1/1.0/result-not-available";

export function processException(httpCode, type, detail) {
  return {
    httpCode,
    type,
    title: type.substring(type.lastIndexOf("/") + 1),
    status: httpCode,
    detail,
    description: detail,
  };
}

export function sendProcessException(res, err) {
  var status = err.httpCode || err.status || 500;
  res.status(status).json({
    type: err.type || "about:blank",
    title: err.title || err.code || String(status),
    status,
    detail: err.detail || err.description || "",
  });
}

export default {
  NO_SUCH_PROCESS,
  NO_SUCH_JOB,
  NO_SUCH_OUTPUT,
  RESULT_NOT_READY,
  RESULT_NOT_AVAILABLE,
  INVALID_PARAMETER,
  SERVER_ERROR,
  processException,
  sendProcessException,
};
