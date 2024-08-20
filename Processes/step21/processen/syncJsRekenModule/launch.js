import add from './add.js'

export function launch(job, process, parameters, callback) {
  var values = [];
  for (let [key, processInput] of Object.entries(process.inputs)) {
    if (!parameters.inputs[key])
      callback({ code: 500, description: `${key} not found` }, undefined);
    values.push(parameters.inputs[key]);
  }

  job.status = 'running'

  var result = {};
  if (process.jobControlOptions == "sync-execute") result = add(values[0], values[1]);
  else return callback({ code: 500, description: "only runs sync" }, undefined);

  let content = {};
  for (let [key, processOutput] of Object.entries(process.outputs)) {
    var outputParameter = parameters.outputs[key];
    if (!outputParameter)
      return callback({ code: 500, description: `${key} not found in outputs declaration` }, undefined);

    if (outputParameter.transmissionMode == "value") content[key] = result;
  }

  job.status = 'completed'

  if (parameters.response == "document") {
    return callback(undefined, content);
  }

  return callback(
    { code: 500, description: "response is only as document" },
    undefined
  );
}
