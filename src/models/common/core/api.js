import { join } from "path";
import { readFileSync } from "fs";
import { getDatabases } from "../../../database/database.js";
import { getProcesses } from "../../../database/processes.js";

const __dirname = import.meta.dirname;

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
      join(__dirname, "..", "..", "..", "apiTemplates", "info.json")
    );
    var content = JSON.parse(jsonStr);

    var ff = JSON.stringify(content);

    ff = ff.replace(new RegExp("{{:title}}", "g"), global.config.metadata.identification.title);
    ff = ff.replace(
      new RegExp("{{:description}}", "g"),
      global.config.metadata.identification.description
    );
    ff = ff.replace(new RegExp("{{:version}}", "g"), process.env.APIVERSION);

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
      join(__dirname, "..", "..", "..", "apiTemplates", "tags.json")
    );
    var tags = JSON.parse(jsonStr);
  }

  {
    // Core
    var jsonStr = readFileSync(
      join(__dirname, "..", "..", "..", "apiTemplates", "core", "paths.json")
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
        "parameters.json"
      )
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
        "schema.json"
      )
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
        "paths.json"
      )
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
        "parameters.json"
      )
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
        "schema.json"
      )
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
          "paths.json"
        )
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
          "parameters.json"
        )
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
          "parameter.json"
        )
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
          "schema.json"
        )
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
        "paths.json"
      )
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
        "parameters.json"
      )
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
        "schema.json"
      )
    );
    var schemas = JSON.parse(jsonStr);

    for (var parameter in parameters) {
      components.components.parameters[parameter] = parameters[parameter];
    }

    for (var schema in schemas) {
      components.components.schemas[schema] = schemas[schema];
    }

    var processes = getProcesses();

    for (var name in processes) {
      var processTemplate = content["/processes/{{:processId}}"];
      var ff = JSON.stringify(processTemplate);

      var ff = ff.replace(new RegExp("{{:processId}}", "g"), name);

      paths.paths[`/processes/${name}`] = JSON.parse(ff);
    }

    for (var name in processes) {
      var processTemplate = content["/processes/{{:processId}}/execution"];
      var ff = JSON.stringify(processTemplate);

      var ff = ff.replace(new RegExp("{{:processId}}", "g"), name);

      paths.paths[`/processes/${name}/execution`] = JSON.parse(ff);
    }
  }

  {
    // Jobs
    var jsonStr = readFileSync(
      join(__dirname, "..", "..", "..", "apiTemplates", "jobs", "paths.json")
    );
    var content = JSON.parse(jsonStr);

    paths.paths["/jobs"] = content["/jobs"];
    paths.paths["/jobs/{jobId}"] = content["/jobs/{jobId}"];
    paths.paths["/jobs{jobId}/results"] = content["/jobs/{jobId}/results"];

    var jsonStr = readFileSync(
      join(
        __dirname,
        "..",
        "..",
        "..",
        "apiTemplates",
        "jobs",
        "components",
        "parameters.json"
      )
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
        "schema.json"
      )
    );
    var schemas = JSON.parse(jsonStr);

    for (var parameter in parameters) {
      components.components.parameters[parameter] = parameters[parameter];
    }

    for (var schema in schemas) {
      components.components.schemas[schema] = schemas[schema];
    }
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
