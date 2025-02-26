import { unpackEdges } from "./parsers";
import { request } from "./request";

export async function fetchTriangleIndices(edgeUrl: string, geomId: string) {
  const url = edgeUrl + geomId;
  const buffer = await request(url);
  return unpackEdges(buffer);
}
