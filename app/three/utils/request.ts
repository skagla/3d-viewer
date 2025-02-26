export async function request(url: string) {
  const response = await fetch(url);
  if (response.ok) {
    return response.arrayBuffer();
  } else {
    throw new Error("HTTP error status: " + response.status);
  }
}
