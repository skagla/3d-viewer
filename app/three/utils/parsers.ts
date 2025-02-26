const DIMENSIONS = 3;
const ONEBYTE = 1;
const FOURBYTE = 4;
const METABYTES = 13;

class BitStream {
  private a: Uint8Array;
  private position: number;
  private bitsPending: number;

  constructor(uint8Array: Uint8Array) {
    this.a = uint8Array;
    this.position = 0;
    this.bitsPending = 0;
  }

  writeBits(bits: number, value: number) {
    if (bits === 0) return;
    value &= 0xffffffff >>> (32 - bits);

    while (bits > 0) {
      if (this.bitsPending === 0) {
        this.a[this.position++] = 0;
        this.bitsPending = 8;
      }

      const bitsToWrite = Math.min(this.bitsPending, bits);
      const shift = this.bitsPending - bitsToWrite;
      this.a[this.position - 1] |= (value >> (bits - bitsToWrite)) << shift;

      bits -= bitsToWrite;
      value &= (1 << bits) - 1;
      this.bitsPending -= bitsToWrite;
    }
  }

  readBits(bits: number, bitBuffer = 0) {
    if (bits === 0) return bitBuffer;

    while (bits > 0) {
      if (this.bitsPending === 0) {
        this.bitsPending = 8;
      }

      const byte = this.a[this.position - (this.bitsPending === 8 ? 0 : 1)];
      const bitsToRead = Math.min(this.bitsPending, bits);
      const shift = this.bitsPending - bitsToRead;
      bitBuffer =
        (bitBuffer << bitsToRead) | ((byte >> shift) & ((1 << bitsToRead) - 1));

      bits -= bitsToRead;
      this.bitsPending -= bitsToRead;
      if (this.bitsPending === 0) this.position++;
    }

    return bitBuffer;
  }

  seekTo(bitPos: number) {
    this.position = Math.floor(bitPos / 8);
    this.bitsPending = bitPos % 8 ? 8 - (bitPos % 8) : 0;
    if (this.bitsPending > 0) this.position++;
  }
}

export function unpackVertices(arrayBuffer: ArrayBuffer) {
  const dataView = new DataView(arrayBuffer);
  let ptr = ONEBYTE + 2 * FOURBYTE;

  // Read the number of points
  const pointsCount = dataView.getUint32(ptr, true);
  ptr += FOURBYTE;

  // Initialize position array
  const posArray = new Float32Array(pointsCount * DIMENSIONS);

  for (let dim = 0; dim < DIMENSIONS; dim++) {
    ptr += ONEBYTE; // Skip unused byte
    const bytesCount = dataView.getInt32(ptr, true) - 8;
    ptr += FOURBYTE;

    const significantBitsCount = dataView.getUint32(ptr, true);
    ptr += FOURBYTE;

    const commonBits = readCommonBits(dataView, ptr);
    ptr += FOURBYTE;

    const significantBits = readSignificantBits(dataView, ptr, bytesCount);
    ptr += bytesCount;

    // Read vertex data
    for (let i = 0, j = dim; i < pointsCount; i++, j += DIMENSIONS) {
      let value = significantBits.readBits(significantBitsCount) | commonBits;
      if (dim === 2) value /= 100; // Adjust Z values
      posArray[j] = value;
    }
  }

  return posArray;
}

export function unpackEdges(arrayBuffer: ArrayBuffer) {
  const dv = new DataView(arrayBuffer, METABYTES);
  const indices = new Uint32Array((arrayBuffer.byteLength - METABYTES) / 4);
  for (let i = 0; i < indices.length; i++) {
    indices[i] = dv.getUint32(i * 4, true);
  }
  return indices;
}

function readSignificantBits(
  dataView: DataView,
  ptr: number,
  bytesCount: number
) {
  const temp = new Int32Array(bytesCount / 4);
  for (let i = 0; i < temp.length; i++, ptr += 4) {
    temp[i] = dataView.getInt32(ptr);
  }
  return new BitStream(new Uint8Array(temp.buffer));
}

function readCommonBits(dataView: DataView, ptr: number) {
  const temp = new Int32Array(1);
  temp[0] = dataView.getInt32(ptr, false);
  const combits = new BitStream(new Uint8Array(temp.buffer));
  return combits.readBits(32);
}
