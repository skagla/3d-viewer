const METABYTES = 13;
export function unpackEdges(arrayBuffer: ArrayBuffer) {
  const dv = new DataView(arrayBuffer, METABYTES);
  const indices = new Uint32Array((arrayBuffer.byteLength - METABYTES) / 4);
  for (let i = 0; i < indices.length; i++) {
    indices[i] = dv.getUint32(i * 4, true);
  }
  return indices;
}

const DIMENSIONS = 3;
const ONEBYTE = 1;
const FOURBYTE = 4; // bytes count for metadata in PG_pointcloud (significant bits compression)
export function unpackVertices(arrayBuffer: ArrayBuffer) {
  const dataView = new DataView(arrayBuffer);
  let ptr = ONEBYTE + 2 * FOURBYTE;
  const pointsCount = dataView.getUint32(ptr, true); // 1 + 4 + 4 = 9 bytes offset
  const posArray = new Float32Array(pointsCount * DIMENSIONS);
  ptr += FOURBYTE;

  let bytesCount;
  let significantBitsCount;
  let commonBits;
  let significantBits;
  for (let dim = 0; dim < 3; dim++) {
    ptr += ONEBYTE;
    bytesCount = dataView.getInt32(ptr, true) - 8;
    ptr += FOURBYTE;
    significantBitsCount = dataView.getUint32(ptr, true);
    ptr += FOURBYTE;
    commonBits = readCommonBits(dataView, ptr);
    ptr += FOURBYTE;
    significantBits = readSignificantBits(dataView, ptr, bytesCount);
    let value = 0.0;
    for (let j = dim, i = 0; i < pointsCount; j += DIMENSIONS, i++) {
      value = significantBits.readBits(significantBitsCount, 0) | commonBits;
      if (dim === 2) {
        value = value / 100; // z values in pc_patch from DB are multiplied by 100
      }
      posArray[j] = value;
    }
    ptr += bytesCount;
  }
  return posArray;
}

function readCommonBits(dataView: DataView, ptr: number) {
  const temp = new Int32Array(1);
  temp[0] = dataView.getInt32(ptr, false);
  const combits = new BitStream(new Uint8Array(temp.buffer));
  return combits.readBits(32, 0);
}

function readSignificantBits(
  dataView: DataView,
  ptr: number,
  bytesCount: number
) {
  const temp = new Int32Array(bytesCount / 4);
  for (let i = ptr, j = 0; i < ptr + bytesCount; i += 4, j++) {
    temp[j] = dataView.getInt32(i);
  }
  const sigbits = new BitStream(new Uint8Array(temp.buffer));
  return sigbits;
}

export class BitStream {
  private a: Uint8Array;
  private position: number;
  private bitsPending: number;

  constructor(uint8Array: Uint8Array) {
    this.a = uint8Array;
    this.position = 0;
    this.bitsPending = 0;
  }

  writeBits(bits: number, value: number) {
    if (bits === 0) {
      return;
    }
    value &= 0xffffffff >>> (32 - bits);
    let bitsConsumed;
    if (this.bitsPending > 0) {
      if (this.bitsPending > bits) {
        this.a[this.position - 1] |= value << (this.bitsPending - bits);
        bitsConsumed = bits;
        this.bitsPending -= bits;
      } else if (this.bitsPending === bits) {
        this.a[this.position - 1] |= value;
        bitsConsumed = bits;
        this.bitsPending = 0;
      } else {
        this.a[this.position - 1] |= value >> (bits - this.bitsPending);
        bitsConsumed = this.bitsPending;
        this.bitsPending = 0;
      }
    } else {
      bitsConsumed = Math.min(8, bits);
      this.bitsPending = 8 - bitsConsumed;
      this.a[this.position++] =
        (value >> (bits - bitsConsumed)) << this.bitsPending;
    }
    bits -= bitsConsumed;
    if (bits > 0) {
      this.writeBits(bits, value);
    }
  }

  readBits(bits: number, bitBuffer: number): number {
    if (typeof bitBuffer === "undefined") {
      bitBuffer = 0;
    }
    if (bits === 0) {
      return bitBuffer;
    }
    let partial;
    let bitsConsumed;
    if (this.bitsPending > 0) {
      const byte = this.a[this.position - 1] & (0xff >> (8 - this.bitsPending));
      bitsConsumed = Math.min(this.bitsPending, bits);
      this.bitsPending -= bitsConsumed;
      partial = byte >> this.bitsPending;
    } else {
      bitsConsumed = Math.min(8, bits);
      this.bitsPending = 8 - bitsConsumed;
      partial = this.a[this.position++] >> this.bitsPending;
    }
    bits -= bitsConsumed;
    bitBuffer = (bitBuffer << bitsConsumed) | partial;
    return bits > 0 ? this.readBits(bits, bitBuffer) : bitBuffer;
  }

  seekTo(bitPos: number) {
    this.position = (bitPos / 8) | 0;
    this.bitsPending = bitPos % 8;
    if (this.bitsPending > 0) {
      this.bitsPending = 8 - this.bitsPending;
      this.position++;
    }
  }
}
