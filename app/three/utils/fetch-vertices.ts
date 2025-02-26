import { unpackVertices } from "./parsers";
import { request } from "./request";

export async function fetchVertices(pointUrl: string, geomId: string) {
  const url = pointUrl + geomId;
  const buffer = await request(url);
  return unpackVertices(buffer);
}
