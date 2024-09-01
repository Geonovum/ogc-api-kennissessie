import { join } from "path"
import { spawn } from "node:child_process"

const __dirname = import.meta.dirname;
if (__dirname === undefined) console.log("need node 20.16 or higher")

  
/**
 * Description placeholder
 *
 * @export
 * @param {*} process
 * @param {*} parameters
 * @param {*} callback
 */
export function launch(process, parameters, job, callback) {
  var values = []
  for (let [key, processInput] of Object.entries(process.inputs)) {
    if (!parameters.inputs[key])
      callback({ code: 500, description: `${key} not found` }, undefined)
    values.push(parameters.inputs[key])
  }

  // spawn https://nodejs.org/api/child_process.html#:~:text=The%20child_process.spawn()%20method,either%20exits%20or%20is%20terminated.
  var result = undefined;
  const child = spawn(join(__dirname, "add.sh"), [values[0], values[1]], {
    shell: true,
  })
  child.stdout.on("data", (d) => {
    result = Number(d);
  })
  child.stderr.on("data", (d) => {
    return callback({ code: 500, description: d.toString() }, undefined)
  })
  child.on("close", () => {
    if (result == undefined) return

    let content = {};
    for (let [key, processOutput] of Object.entries(process.outputs)) {
      var outputParameter = parameters.outputs[key]
      if (!outputParameter)
        return callback(
          { code: 500, description: `${key} not found in outputs declaration` },
          undefined
        )

      if (outputParameter.transmissionMode == "value") content[key] = result
    }

    if (parameters.response == "document") {
      return callback(undefined, content)
    }
  });
}
