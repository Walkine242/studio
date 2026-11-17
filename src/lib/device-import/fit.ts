// Minimal decoder for Garmin's FIT activity files (also used by Coros, Suunto,
// Wahoo, Polar and Apple Watch export apps). Implements the FIT protocol's
// record structure: file header, definition messages (incl. developer fields),
// normal and compressed-timestamp data messages, and all base types.
// It returns raw field values keyed by message/field number; interpretation
// (scales, units) happens in parse-swim.ts.

export interface FitMessage {
  /** Global message number, e.g. 18 = session, 19 = lap, 101 = length. */
  num: number;
  fields: Record<number, number | string | number[] | null>;
}

interface FieldDef { num: number; size: number; baseType: number }
interface Definition { globalNum: number; littleEndian: boolean; fields: FieldDef[]; devSize: number }

/** Seconds between the Unix epoch and the FIT epoch (1989-12-31T00:00:00Z). */
export const FIT_EPOCH_OFFSET = 631065600;

// base type number (low 5 bits) -> [size in bytes, invalid value]
const BASE: Record<number, [number, number | bigint | null]> = {
  0x00: [1, 0xff],          // enum
  0x01: [1, 0x7f],          // sint8
  0x02: [1, 0xff],          // uint8
  0x03: [2, 0x7fff],        // sint16
  0x04: [2, 0xffff],        // uint16
  0x05: [4, 0x7fffffff],    // sint32
  0x06: [4, 0xffffffff],    // uint32
  0x07: [1, null],          // string
  0x08: [4, null],          // float32 (invalid = NaN pattern, handled below)
  0x09: [8, null],          // float64
  0x0a: [1, 0x00],          // uint8z
  0x0b: [2, 0x0000],        // uint16z
  0x0c: [4, 0x00000000],    // uint32z
  0x0d: [1, 0xff],          // byte
  0x0e: [8, null],          // sint64
  0x0f: [8, null],          // uint64
  0x10: [8, null],          // uint64z
};

function readValue(view: DataView, offset: number, baseType: number, le: boolean): number | null {
  switch (baseType) {
    case 0x00: case 0x02: case 0x0a: case 0x0d: return view.getUint8(offset);
    case 0x01: return view.getInt8(offset);
    case 0x03: return view.getInt16(offset, le);
    case 0x04: case 0x0b: return view.getUint16(offset, le);
    case 0x05: return view.getInt32(offset, le);
    case 0x06: case 0x0c: return view.getUint32(offset, le);
    case 0x08: { const v = view.getFloat32(offset, le); return Number.isFinite(v) ? v : null; }
    case 0x09: { const v = view.getFloat64(offset, le); return Number.isFinite(v) ? v : null; }
    case 0x0e: return Number(view.getBigInt64(offset, le));
    case 0x0f: case 0x10: return Number(view.getBigUint64(offset, le));
    default: return view.getUint8(offset);
  }
}

function isInvalid(value: number | null, baseType: number): boolean {
  if (value === null) return true;
  const inv = BASE[baseType]?.[1];
  return inv !== null && inv !== undefined && typeof inv === 'number' && value === inv;
}

export class FitError extends Error {}

/** Decodes every data message in a FIT file. Throws FitError if it isn't one. */
export function decodeFit(buffer: ArrayBuffer): FitMessage[] {
  const view = new DataView(buffer);
  if (buffer.byteLength < 12) throw new FitError('File is too small to be a FIT file.');
  const headerSize = view.getUint8(0);
  const sig = String.fromCharCode(view.getUint8(8), view.getUint8(9), view.getUint8(10), view.getUint8(11));
  if ((headerSize !== 12 && headerSize !== 14) || sig !== '.FIT') throw new FitError('Not a FIT file.');

  const messages: FitMessage[] = [];
  let pos = 0;
  // A file can contain several FIT segments back to back ("chained" files).
  while (pos + 12 <= buffer.byteLength) {
    const hSize = view.getUint8(pos);
    const dataSize = view.getUint32(pos + 4, true);
    const s = String.fromCharCode(view.getUint8(pos + 8), view.getUint8(pos + 9), view.getUint8(pos + 10), view.getUint8(pos + 11));
    if ((hSize !== 12 && hSize !== 14) || s !== '.FIT') break;
    const start = pos + hSize;
    const end = Math.min(start + dataSize, buffer.byteLength);
    try {
      decodeSegment(view, start, end, messages);
    } catch (e) {
      if (e instanceof FitError) throw e;
      throw new FitError('Damaged FIT file.');
    }
    pos = end + 2; // skip the file CRC
  }
  return messages;
}

function decodeSegment(view: DataView, start: number, end: number, out: FitMessage[]) {
  const defs = new Map<number, Definition>();
  let lastTimestamp = 0;
  let p = start;
  while (p < end) {
    const header = view.getUint8(p++);
    let local: number;
    let compressedOffset: number | null = null;

    if (header & 0x80) {
      // Compressed timestamp header: data message with a 5-bit time offset.
      local = (header >> 5) & 0x03;
      compressedOffset = header & 0x1f;
    } else {
      local = header & 0x0f;
      if (header & 0x40) {
        // Definition message.
        const hasDev = (header & 0x20) !== 0;
        p++; // reserved
        const le = view.getUint8(p++) === 0;
        const globalNum = view.getUint16(p, le); p += 2;
        const nFields = view.getUint8(p++);
        const fields: FieldDef[] = [];
        for (let i = 0; i < nFields; i++) {
          fields.push({ num: view.getUint8(p), size: view.getUint8(p + 1), baseType: view.getUint8(p + 2) & 0x1f });
          p += 3;
        }
        let devSize = 0;
        if (hasDev) {
          const nDev = view.getUint8(p++);
          for (let i = 0; i < nDev; i++) { devSize += view.getUint8(p + 1); p += 3; }
        }
        defs.set(local, { globalNum, littleEndian: le, fields, devSize });
        continue;
      }
    }

    const def = defs.get(local);
    if (!def) throw new FitError('Damaged FIT file (data before its definition).');
    const msg: FitMessage = { num: def.globalNum, fields: {} };
    for (const f of def.fields) {
      if (p + f.size > view.byteLength) throw new FitError('Damaged FIT file (truncated).');
      const typeSize = BASE[f.baseType]?.[0] ?? 1;
      if (f.baseType === 0x07) {
        let str = '';
        for (let i = 0; i < f.size; i++) {
          const c = view.getUint8(p + i);
          if (c === 0) break;
          str += String.fromCharCode(c);
        }
        msg.fields[f.num] = str || null;
      } else if (f.size > typeSize && f.size % typeSize === 0) {
        const arr: number[] = [];
        for (let i = 0; i < f.size; i += typeSize) {
          const v = readValue(view, p + i, f.baseType, def.littleEndian);
          if (!isInvalid(v, f.baseType)) arr.push(v as number);
        }
        msg.fields[f.num] = arr;
      } else if (f.size === typeSize) {
        const v = readValue(view, p, f.baseType, def.littleEndian);
        msg.fields[f.num] = isInvalid(v, f.baseType) ? null : v;
      } else {
        msg.fields[f.num] = null; // size doesn't match the type: skip
      }
      p += f.size;
    }
    p += def.devSize;

    // Track timestamps so compressed-timestamp messages get a real one.
    const ts = msg.fields[253];
    if (typeof ts === 'number') {
      lastTimestamp = ts;
    } else if (compressedOffset !== null) {
      let t = (lastTimestamp & ~0x1f) + compressedOffset;
      if (compressedOffset < (lastTimestamp & 0x1f)) t += 0x20;
      lastTimestamp = t;
      msg.fields[253] = t;
    }
    out.push(msg);
  }
}

/** FIT timestamp (seconds since 1989-12-31) to a JS Date. */
export function fitDate(seconds: number): Date {
  return new Date((seconds + FIT_EPOCH_OFFSET) * 1000);
}
