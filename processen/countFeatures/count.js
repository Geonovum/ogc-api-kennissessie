export default async function count(uri) {
  const res = await fetch(uri);
  const body = await res.json();
  return body.numberMatched;
}
