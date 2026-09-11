export default async function count(uri) {
  var parsed;
  try {
    parsed = new URL(uri);
  } catch (err) {
    throw new Error("not a valid URL");
  }

  var path = parsed.pathname.replace(/\/+$/, "");
  if (!path.endsWith("/items")) {
    throw new Error(
      "not a valid endpoint, should be OGC API features /items endpoint",
    );
  }

  parsed.pathname = path;
  var fetchUrl = parsed.toString();

  var res;
  try {
    res = await fetch(fetchUrl);
  } catch (err) {
    throw new Error(`Unable to fetch features endpoint: ${err.message}`);
  }

  if (!res.ok)
    throw new Error(`Features endpoint returned HTTP ${res.status}`);

  var body;
  try {
    body = await res.json();
  } catch (err) {
    throw new Error("Features endpoint did not return JSON");
  }

  if (typeof body.numberMatched !== "number")
    throw new Error("Features endpoint did not return numberMatched");

  return body.numberMatched;
}
