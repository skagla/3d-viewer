let lastId = 0;

export function stamp(obj: any) {
  return obj._id ?? (obj._id = ++lastId);
}
