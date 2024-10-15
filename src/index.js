import { join } from "path";
import { app } from "./app.js";
import { readData } from "./database/database.js";
import { readProcesses } from "./database/processes.js";
import { readMetadata } from "./database/metadata.js";

const __dirname = import.meta.dirname;
if (__dirname === undefined) console.log("need node 20.16 or higher");

// Load data (TODO: async)
try {
  var dataPath = join(
    process.env.DATA_PATH || join(__dirname, "../data"),
    "datasets"
  );
  readData(dataPath);

  var processenPath = join(
    process.env.DATA_PATH || join(__dirname, "../data"),
    "processes"
  );
  readProcesses(processenPath);

  var metadataPath = join(
    process.env.DATA_PATH || join(__dirname, "../data"),
    "metadata"
  );
  readMetadata(metadataPath);

} catch (err) {
  console.log(err);
}

app.listen(process.env.PORT, function (error) {
  if (error) {
    console.log("Unable to listen for connections", error);
    process.exit(10);
  }

  console.log(
    `OGC API Feature & Processes listening on port ${process.env.PORT}`
  );
});
