import { join } from "path";
import { readFileSync } from "fs";
import { getDatabases } from "../../../database/database.js";
import { getProcesses, getJobs } from "../../../database/processes.js";

const __dirname = import.meta.dirname;

function processDescriptionExample(process_) {
  var example = {
    id: process_.id,
    title: process_.title,
    description: process_.description,
    version: process_.version,
    jobControlOptions: process_.jobControlOptions,
    outputTransmission: process_.outputTransmission,
    inputs: process_.inputs,
    outputs: process_.outputs,
    example: process_.example,
  };
  if (process_.keywords) example.keywords = process_.keywords;
  if (process_.metadata) example.metadata = process_.metadata;
  return example;
}

function toOpenApi3Schema(schema) {
  if (Array.isArray(schema)) {
    for (var i = 0; i < schema.length; i++) schema[i] = toOpenApi3Schema(schema[i]);
    return schema;
  }
  if (!schema || typeof schema !== "object") return schema;

  if (schema.contentEncoding === "binary" && !schema.format) schema.format = "binary";
  else if (schema.contentEncoding === "base64" && !schema.format) schema.format = "byte";
  if (schema.contentMediaType) {
    var media = schema.contentMediaType;
    schema.description = schema.description
      ? `${schema.description} (media type: ${media})`
      : `Media type: ${media}`;
  }
  delete schema.contentEncoding;
  delete schema.contentMediaType;
  delete schema.contentSchema;

  for (var nested of ["items", "additionalProperties", "not"]) {
    if (schema[nested]) schema[nested] = toOpenApi3Schema(schema[nested]);
  }
  for (var combiner of ["oneOf", "anyOf", "allOf"]) {
    if (Array.isArray(schema[combiner])) schema[combiner] = toOpenApi3Schema(schema[combiner]);
  }
  for (var mapKey of ["properties", "patternProperties"]) {
    if (schema[mapKey] && typeof schema[mapKey] === "object") {
      for (var prop of Object.keys(schema[mapKey])) {
        schema[mapKey][prop] = toOpenApi3Schema(schema[mapKey][prop]);
      }
    }
  }
  return schema;
}

function cloneFieldSchema(field) {
  var schema = structuredClone(field.schema || {});
  if (field.title) schema.title = field.title;
  if (field.description) schema.description = field.description;
  return toOpenApi3Schema(schema);
}

function isRequiredInput(input) {
  var schema = input.schema || {};
  return schema.nullable !== true && schema.default === undefined;
}

function executeSchema(process_) {
  var inputProperties = {};
  var requiredInputs = [];
  for (var key of Object.keys(process_.inputs || {})) {
    inputProperties[key] = cloneFieldSchema(process_.inputs[key]);
    if (isRequiredInput(process_.inputs[key])) requiredInputs.push(key);
  }

  var outputProperties = {};
  for (var key of Object.keys(process_.outputs || {})) {
    outputProperties[key] = {
      type: "object",
      properties: {
        transmissionMode: {
          type: "string",
          enum: ["value", "reference"],
        },
      },
    };
  }

  var inputs = {
    type: "object",
    properties: inputProperties,
    additionalProperties: false,
  };
  if (requiredInputs.length) inputs.required = requiredInputs;

  return {
    type: "object",
    properties: {
      inputs,
      outputs: {
        type: "object",
        properties: outputProperties,
        additionalProperties: false,
      },
      response: {
        type: "string",
        enum: ["raw", "document"],
      },
      subscriber: {
        description:
          "Optional URIs this server POSTs to when the job progresses, succeeds, or fails (callback conformance class).",
        type: "object",
        properties: {
          successUri: { type: "string", format: "uri" },
          inProgressUri: { type: "string", format: "uri" },
          failedUri: { type: "string", format: "uri" },
        },
      },
    },
  };
}

function resultsSchema(process_) {
  var properties = {};
  for (var key of Object.keys(process_.outputs || {})) {
    properties[key] = cloneFieldSchema(process_.outputs[key]);
  }
  return {
    type: "object",
    properties,
  };
}

function executionCallbacks(name) {
  return {
    success: {
      "{$request.body#/subscriber/successUri}": {
        post: {
          summary: "POST job results to the subscriber successUri",
          description:
            "Called by this server when the job succeeds. The URL is supplied by the client in subscriber.successUri.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/results_${name}` },
              },
            },
          },
          responses: {
            "200": { description: "Notification received" },
          },
        },
      },
    },
    inProgress: {
      "{$request.body#/subscriber/inProgressUri}": {
        post: {
          summary: "POST job status to the subscriber inProgressUri",
          description:
            "Called by this server while the job is running. The URL is supplied by the client in subscriber.inProgressUri.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/StatusInfo" },
              },
            },
          },
          responses: {
            "200": { description: "Notification received" },
          },
        },
      },
    },
    failed: {
      "{$request.body#/subscriber/failedUri}": {
        post: {
          summary: "POST an exception to the subscriber failedUri",
          description:
            "Called by this server when the job fails. The URL is supplied by the client in subscriber.failedUri.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "https://schemas.opengis.net/ogcapi/processes/part1/1.0/openapi/schemas/exception.yaml",
                },
              },
            },
          },
          responses: {
            "200": { description: "Notification received" },
          },
        },
      },
    },
  };
}

function packageSchema(process_) {
  var properties = {};
  for (var key of Object.keys(process_.outputs || {})) {
    properties[key] = cloneFieldSchema(process_.outputs[key]);
  }
  return {
    type: "object",
    properties,
  };
}

function get(neutralUrl, callback) {
  var content = {};

  // (OAPIF C) Requirement 47 The JSON representation SHALL conform to the OpenAPI Specification, version 3.0.
  //
  // Note: OpenAPI definitions can be created using different approaches. A typical example is the representation
  // of the feature collections. One approach is to use a path parameter collectionId, i.e., the API definition
  // has only a single path entry for all feature collections. Another approach is to explicitly define each
  // feature collection in a separate path and without a path parameter, which allows to specify filter parameters
  // or explicit feature schemas per feature collection. Both approaches are valid.

  {
    // OpenAPI header, version
    var openapi = {};
    openapi.openapi = "3.0.2"; // OpenAPI version (not the version this OGC API Features)
  }

  {
    // Info
    var jsonStr = readFileSync(
      join(__dirname, "..", "..", "..", "apiTemplates", "info.json"),
    );
    var content = JSON.parse(jsonStr);

    var ff = JSON.stringify(content);

    ff = ff.replace(
      new RegExp("{{:title}}", "g"),
      global.config.metadata.identification.title,
    );
    ff = ff.replace(
      new RegExp("{{:description}}", "g"),
      global.config.metadata.identification.description,
    );
    ff = ff.replace(new RegExp("{{:version}}", "g"), global.config.api.version);

    var info = JSON.parse(ff);
  }

  {
    // Servers
    serverUrl = neutralUrl; // remove /api from neutralUrl
    var serverUrl = serverUrl.substr(0, serverUrl.lastIndexOf("/"));

    var servers = { servers: [] };

    var server = {};
    server.url = serverUrl;
    servers.servers.push(server);
  }

  {
    // Tags
    var jsonStr = readFileSync(
      join(__dirname, "..", "..", "..", "apiTemplates", "tags.json"),
    );
    var tags = JSON.parse(jsonStr);
  }

  {
    // Core
    var jsonStr = readFileSync(
      join(__dirname, "..", "..", "..", "apiTemplates", "core", "paths.json"),
    );
    var content = JSON.parse(jsonStr);

    var jsonStr = readFileSync(
      join(
        __dirname,
        "..",
        "..",
        "..",
        "apiTemplates",
        "core",
        "components",
        "parameters.json",
      ),
    );
    var parameters = JSON.parse(jsonStr);

    var jsonStr = readFileSync(
      join(
        __dirname,
        "..",
        "..",
        "..",
        "apiTemplates",
        "core",
        "components",
        "schema.json",
      ),
    );
    var schemas = JSON.parse(jsonStr);

    var paths = { paths: content };

    var components = { components: {} };
    components.components.schemas = {};
    components.components.parameters = {};

    for (var parameter in parameters) {
      components.components.parameters[parameter] = parameters[parameter];
    }

    for (var schema in schemas) {
      components.components.schemas[schema] = schemas[schema];
    }
  }

  {
    // Collections
    var jsonStr = readFileSync(
      join(
        __dirname,
        "..",
        "..",
        "..",
        "apiTemplates",
        "collections",
        "paths.json",
      ),
    );
    var content = JSON.parse(jsonStr);

    paths.paths["/collections"] = content["/collections"];

    var jsonStr = readFileSync(
      join(
        __dirname,
        "..",
        "..",
        "..",
        "apiTemplates",
        "collections",
        "components",
        "parameters.json",
      ),
    );
    var parameters = JSON.parse(jsonStr);

    var jsonStr = readFileSync(
      join(
        __dirname,
        "..",
        "..",
        "..",
        "apiTemplates",
        "collections",
        "components",
        "schema.json",
      ),
    );
    var schemas = JSON.parse(jsonStr);

    for (var parameter in parameters) {
      components.components.parameters[parameter] = parameters[parameter];
    }

    for (var schema in schemas) {
      components.components.schemas[schema] = schemas[schema];
    }

    var databases = getDatabases();

    for (var name in databases) {
      var collectionTemplate = content["/collections/{{:collectionId}}"];
      var ff = JSON.stringify(collectionTemplate);

      var ff = ff.replace(new RegExp("{{:collectionId}}", "g"), name);

      paths.paths[`/collections/${name}`] = JSON.parse(ff);
    }
  }

  {
    // items

    var processes = getDatabases();

    for (var name in processes) {
      var process_ = processes[name];

      var jsonStr = readFileSync(
        join(
          __dirname,
          "..",
          "..",
          "..",
          "apiTemplates",
          "features",
          "paths.json",
        ),
      );
      var content = JSON.parse(jsonStr);

      var ff = JSON.stringify(content);
      var ff = ff.replace(new RegExp("{{:collectionId}}", "g"), name);
      var items = JSON.parse(ff);

      var jsonStr = readFileSync(
        join(
          __dirname,
          "..",
          "..",
          "..",
          "apiTemplates",
          "features",
          "components",
          "parameters.json",
        ),
      );
      var parameters = JSON.parse(jsonStr);
      var ff = JSON.stringify(parameters);
      var ff = ff.replace(new RegExp("{{:collectionId}}", "g"), name);
      var parameters = JSON.parse(ff);

      var jsonStr = readFileSync(
        join(
          __dirname,
          "..",
          "..",
          "..",
          "apiTemplates",
          "features",
          "components",
          "parameter.json",
        ),
      );
      var parameter = JSON.parse(jsonStr);

      var itemsParameters =
        items[`/collections/${name}/items`]["get"]["parameters"];
      var propertiesSchema =
        parameters[`properties_${name}`]["schema"]["items"]["enum"];

      for (var propName in process_.schema) {
        var property = process_.schema[propName];
        if (property["x-ogc-role"] != "primary-geometry") {
          var ff = JSON.stringify(parameter);
          var ff = ff.replace(new RegExp("{{:propertyId}}", "g"), propName);
          var ff = ff.replace(new RegExp("{{:collectionId}}", "g"), name);

          var schema = parameter.schema;

          parameters[`${propName}_${name}`] =
            JSON.parse(ff)[`${propName}_${name}`];

          propertiesSchema.push(propName);

          itemsParameters.push({
            $ref: `#/components/parameters/${propName}_${name}`,
          });
        }
      }

      var jsonStr = readFileSync(
        join(
          __dirname,
          "..",
          "..",
          "..",
          "apiTemplates",
          "features",
          "components",
          "schema.json",
        ),
      );
      var schemas = JSON.parse(jsonStr);
      var ff = JSON.stringify(schemas);
      var ff = ff.replace(new RegExp("{{:collectionId}}", "g"), name);
      var schemas = JSON.parse(ff);

      // TODO featureGeoJson from database schema
      var properties =
        schemas[`featureGeoJson_${name}`].properties.properties.properties;
      var required =
        schemas[`featureGeoJson_${name}`].properties.properties.required;

      for (var propName in process_.schema) {
        var property = process_.schema[propName];

        if (property["x-ogc-role"] != "primary_geometry") {
          properties[propName] = structuredClone(property);

          if (
            property["x-ogc-role"] !== undefined &&
            property["x-ogc-role"] == "id"
          )
            required.push(propName);

          delete properties[propName]["x-ogc-role"];
        }
      }

      for (var parameter in parameters) {
        components.components.parameters[parameter] = parameters[parameter];
      }

      for (var schema in schemas) {
        components.components.schemas[schema] = schemas[schema];
      }

      for (var part in items) {
        paths.paths[part] = items[part];
      }
    }
  }

  {
    // Processes
    var jsonStr = readFileSync(
      join(
        __dirname,
        "..",
        "..",
        "..",
        "apiTemplates",
        "processes",
        "paths.json",
      ),
    );
    var content = JSON.parse(jsonStr);

    paths.paths["/processes"] = content["/processes"];

    var jsonStr = readFileSync(
      join(
        __dirname,
        "..",
        "..",
        "..",
        "apiTemplates",
        "processes",
        "components",
        "parameters.json",
      ),
    );
    var parameters = JSON.parse(jsonStr);

    var jsonStr = readFileSync(
      join(
        __dirname,
        "..",
        "..",
        "..",
        "apiTemplates",
        "processes",
        "components",
        "schema.json",
      ),
    );
    var schemas = JSON.parse(jsonStr);

    for (var parameter in parameters) {
      components.components.parameters[parameter] = parameters[parameter];
    }

    for (var schema in schemas) {
      components.components.schemas[schema] = schemas[schema];
    }

    var processes = getProcesses();

    // Process endpoints
    for (var name in processes) {
      var process_ = processes[name];
      var processTemplate = content["/processes/{{:processId}}"];
      var ff = JSON.stringify(processTemplate);
      ff = ff.replace(new RegExp("{{:processId}}", "g"), name);
      var processPath = JSON.parse(ff);

      processPath.get.summary = process_.title || `Retrieve process ${name}`;
      processPath.get.description =
        process_.description || processPath.get.description;
      processPath.get.responses["200"].content["application/json"].example =
        processDescriptionExample(process_);
      if (processPath.delete)
        processPath.delete.summary = `Undeploy process ${process_.title || name}`;
      if (processPath.put)
        processPath.put.summary = `Replace process ${process_.title || name}`;

      paths.paths[`/processes/${name}`] = processPath;
    }

    // execution endpoints
    for (var name in processes) {
      var process_ = processes[name];
      var processTemplate = content["/processes/{{:processId}}/execution"];
      var ff = JSON.stringify(processTemplate);
      ff = ff.replace(new RegExp("{{:processId}}", "g"), name);
      var packagePath = JSON.parse(ff);

      components.components.schemas[`execute_${name}`] =
        executeSchema(process_);
      components.components.schemas[`results_${name}`] =
        resultsSchema(process_);

      packagePath.post.summary = `Execute ${process_.title || name}`;
      packagePath.post.description =
        process_.description || packagePath.post.description;
      packagePath.post.requestBody = {
        required: true,
        description: `Execute request for process ${name}`,
        content: {
          "application/json": {
            schema: {
              $ref: `#/components/schemas/execute_${name}`,
            },
          },
        },
      };
      if (process_.example)
        packagePath.post.requestBody.content["application/json"].example =
          process_.example;

      packagePath.post.responses["200"].content["application/json"].schema = {
        $ref: `#/components/schemas/results_${name}`,
      };
      packagePath.post.callbacks = executionCallbacks(name);

      paths.paths[`/processes/${name}/execution`] = packagePath;
    }

    // package endpoints
    for (var name in processes) {
      var process_ = processes[name];
      var processTemplate = content["/processes/{{:processId}}/package"];
      var ff = JSON.stringify(processTemplate);
      ff = ff.replace(new RegExp("{{:processId}}", "g"), name);
      var packagePath = JSON.parse(ff);

      components.components.schemas[`package_${name}`] =
        packageSchema(process_);

      packagePath.get.summary = `Package ${process_.title || name}`;
      packagePath.get.description =
        process_.description || packagePath.post.description;

      paths.paths[`/processes/${name}/package`] = packagePath;
    }
  }

  {
    // Jobs
    var jsonStr = readFileSync(
      join(__dirname, "..", "..", "..", "apiTemplates", "jobs", "paths.json"),
    );
    var content = JSON.parse(jsonStr);

    paths.paths["/jobs"]                                = content["/jobs"];
    paths.paths["/jobs/{jobId}"]                        = content["/jobs/{jobId}"];
    paths.paths["/jobs/{jobId}/results"]                = content["/jobs/{jobId}/results"];
    paths.paths["/jobs/{jobId}/results/{outputId}"]     = content["/jobs/{jobId}/results/{outputId}"];
    paths.paths["/jobs/{jobId}/results/{outputId}/0"]   = content["/jobs/{jobId}/results/{outputId}/0"];
    paths.paths["/jobs/{jobId}/definition"]             = content["/jobs/{jobId}/definition"];
    paths.paths["/jobs/{jobId}/prov"]                   = content["/jobs/{jobId}/prov"];

    var jsonStr = readFileSync(
      join(
        __dirname,
        "..",
        "..",
        "..",
        "apiTemplates",
        "jobs",
        "components",
        "parameters.json",
      ),
    );
    var parameters = JSON.parse(jsonStr);

    var jsonStr = readFileSync(
      join(
        __dirname,
        "..",
        "..",
        "..",
        "apiTemplates",
        "jobs",
        "components",
        "schema.json",
      ),
    );
    var schemas = JSON.parse(jsonStr);

    for (var parameter in parameters) {
      components.components.parameters[parameter] = parameters[parameter];
    }

    for (var schema in schemas) {
      components.components.schemas[schema] = schemas[schema];
    }

      var jobs = getJobs();

  }

  var content = {
    ...openapi,
    ...info,
    ...servers,
    ...tags,
    ...paths,
    ...components,
  };

  return callback(undefined, content);
}

export default {
  get,
};
