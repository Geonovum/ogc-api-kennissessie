import accepts from "accepts";
import landingPage from "../../../models/common/core/landingPage.js";
import utils from "../../../utils/utils.js";

export function get(req, res) {
  // Note: trailing slash is allowed here

  // (OAPIC) Req 8: The server SHALL respond with a response with the status code 400,
  //         if the request URI includes a query parameter that is not specified in the API definition
  var queryParams = ["f"];
  var rejected = utils.checkForAllowedQueryParams(req.query, queryParams);
  if (rejected.length > 0) {
    res.status(400).json({
      code: `The following query parameters are rejected: ${rejected}`,
      description: "Valid parameters for this request are " + queryParams,
    });
    return;
  }

  var formatFreeUrl = utils.getFormatFreeUrl(req);
  var serviceUrl = utils.getServiceUrl(req);

  var accept = accepts(req);
  var format = accept.type(["json", "html"]);

  landingPage.get(formatFreeUrl, format, function (err, content) {
    if (err) {
      res
        .status(err.httpCode)
        .json({ code: err.code, description: err.description });
      return;
    }

    // (OAPIC) Recommendation 5A: To support browsing the dataset and its features with a web browser
    //         and to enable search engines to crawl and index the dataset, implementations SHOULD
    //         consider to support an HTML encoding.
    // (OAPIC) Recommendation 6A: If the feature data can be represented for the intended use in GeoJSON,
    //         implementations SHOULD consider to support GeoJSON as an encoding for features and feature
    //         collections.
    switch (format) {
      case "json":
        // Recommendations 1, A 200-response SHOULD include the following links in the links property of the response:
        res.set("link", utils.makeHeaderLinks(content.links));
        res.status(200).json(content);
        break;
      case `html`:
        // Recommendations 1, A 200-response SHOULD include the following links in the links property of the response:
        res.set("link", utils.makeHeaderLinks(content.links));
        res.status(200).render(`landingPage`, { content, serviceUrl });
        break;
      default:
        res.status(400).json({
          code: "InvalidParameterValue",
          description: `${accept} is an invalid format`,
        });
    }
  });
}
