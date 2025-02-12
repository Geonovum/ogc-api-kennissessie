export default async function count(uri) {
  if (uri.endsWith("/items")){
    const res = await fetch(uri);
    const body = await res.json();
    return body.numberMatched;
  } else {
    return "not a valid endpoint..."
  }
  
}
