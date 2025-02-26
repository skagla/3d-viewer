export async function getMetadata(serviceUrl: string) {
  const response = await fetch(serviceUrl, {
    method: "GET",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (response.ok) {
    return response.json();
  } else {
    throw new Error("HTTP error status: " + response.status);
  }
}
