function add(numbers) {
  let sum = 0;
  numbers.forEach((number) => {
    sum += number;
  });
  return sum;
}

export function launch(process, parameters, callback) {
  var values = [];
  for (let [key, processInput] of Object.entries(process.inputs)) {
    if (!parameters.inputs[key])
      callback({ code: 500, description: `${key} not found` }, undefined);
    values.push(parameters.inputs[key]);
  }

  var result = {};
  if (process.jobControlOptions == "sync-execute") result = add(values);
  else return callback({ code: 500, description: "only runs sync" }, undefined);

  let content = {};
  for (let [key, processOutput] of Object.entries(process.outputs)) {
    var outputParameter = parameters.outputs[key];
    if (!outputParameter)
      callback({ code: 500, description: `${key} not found` }, undefined);

    if (outputParameter.transmissionMode == "value") content[key] = result;
  }

  if (parameters.response == "document") {
    return callback(undefined, content);
  }

  return callback(
    { code: 500, description: "response is only as document" },
    undefined
  );
}
