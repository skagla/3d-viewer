import { request } from "./request";
import { unpackEdges } from "./parsers";

export async function fetchTriangleIndices(edgeUrl: string, geomId: string) {
  const url = edgeUrl + geomId;
  const buffer = await request(url);
  return unpackEdges(buffer);
}
