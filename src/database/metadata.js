import { join } from "path";
import fs from "fs";
import { parseString } from "xml2js";

export async function readMetadata(dir) {
  if (fs.existsSync(dir)) {
    var fileNames = fs.readdirSync(dir).filter((fn) => fn.endsWith(".xml"));

    fileNames.forEach((fileName) => {
      var path = join(dir, fileName);
      var xmlData = fs.readFileSync(path, { encoding: "utf-8" });

      // parsing xml data
      parseString(xmlData, function (err, results) {
        var oapir = results;
        oapir.location = path;
        oapir.id = results["dcat:CatalogRecord"]["dct:identifier"]

        _metadata[oapir.id] = oapir;
      });
    });
  }

  console.log(`Found ${Object.keys(_metadata).length} metadata records`);
}

var _metadata = {};
