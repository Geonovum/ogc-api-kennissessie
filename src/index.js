import { join } from "path";
import { app } from "./app.js";
import { readData } from "./database/database.js";
import { readProcesses } from "./database/processes.js";
import { readMetadata } from "./database/metadata.js";
import utils from "./utils/utils.js";

const __dirname = import.meta.dirname;
if (__dirname === undefined) console.log("need node 22 or higher (and Express 5 or higher)");

// Load data (TODO: async)
try {
  var dataPath = join(
    global.config.DATA_PATH || join(__dirname, "../data"),
    "datasets"
  );
  readData(dataPath);

  var processenPath = join(
    global.config.DATA_PATH || join(__dirname, "../data"),
    "processes"
  );
  readProcesses(processenPath);

  var metadataPath = join(
    global.config.DATA_PATH || join(__dirname, "../data"),
    "metadata"
  );
  readMetadata(metadataPath);

} catch (err) {
  console.log(err);
}

// Listen on all IPv4 interfaces
const host = global.config.server.host;
const port = global.config.server.port;

app.listen(port, host, function (error) {
  if (error) {
    console.log("Unable to listen for connections", error);
    process.exit(10);
  }

  console.log(`\nOGC API Feature & Processes listening on:`);
  console.log(`  Host: ${host}`);
  console.log(`  Port: ${port}`);
  console.log(`  Service Root: ${app.serviceRoot}`);
  
  // Show all accessible URLs
  console.log(`\nAccessible URLs:`);
  if (host === '0.0.0.0') {
    // Get all bindable IPv4 addresses
    const bindableAddresses = utils.getBindableAddresses();

    bindableAddresses.forEach(addr => {
      console.log(`  http://${addr.address}:${port}${app.serviceRoot}`);
    });
    
    // Also show localhost
    console.log(`  http://localhost:${port}${app.serviceRoot}`);
    console.log(`  http://127.0.0.1:${port}${app.serviceRoot}`);
  } else {
    console.log(`  http://${host}:${port}${app.serviceRoot}`);
  }
});
