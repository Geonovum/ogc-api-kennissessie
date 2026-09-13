import accepts from "accepts";
import execution from "../../models/processes/execution.js";
import utils from "../../utils/utils.js";

export function patch(req, res) {
  // (ADR) /core/no-trailing-slash Leave off trailing slashes from URIs (if not, 404)
  // https://gitdocumentatie.logius.nl/publicatie/api/adr/#/core/no-trailing-slash
  if (utils.ifTrailingSlash(req, res)) return;

}
