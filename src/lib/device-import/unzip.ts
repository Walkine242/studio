// Tiny ZIP reader for Garmin's "Export Original" downloads (a .zip holding the
// .fit file). Uses the browser's built-in DecompressionStream, so no library.

export interface ZipEntry { name: string; data: Uint8Array }

async function inflateRaw(bytes: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser can’t open .zip files. Unzip it first and choose the .fit file inside.');
  }
  const stream = new Blob([bytes as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw' as CompressionFormat));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Returns the files in a ZIP whose names match `want` (e.g. /\.(fit|tcx)$/i). */
export async function readZip(buffer: ArrayBuffer, want: RegExp, maxFiles = 50): Promise<ZipEntry[]> {
  const view = new DataView(buffer);
  const u8 = new Uint8Array(buffer);
  // Find the End Of Central Directory record (signature 0x06054b50) near the end.
  let eocd = -1;
  for (let i = buffer.byteLength - 22; i >= Math.max(0, buffer.byteLength - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('This .zip file is damaged.');
  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const out: ZipEntry[] = [];
  const decoder = new TextDecoder();

  for (let i = 0; i < count && out.length < maxFiles; i++) {
    if (view.getUint32(p, true) !== 0x02014b50) break;
    const method = view.getUint16(p + 10, true);
    const compSize = view.getUint32(p + 20, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const localOffset = view.getUint32(p + 42, true);
    const name = decoder.decode(u8.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;

    if (!want.test(name) || name.startsWith('__MACOSX/')) continue;
    if (view.getUint32(localOffset, true) !== 0x04034b50) continue;
    const lNameLen = view.getUint16(localOffset + 26, true);
    const lExtraLen = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + lNameLen + lExtraLen;
    const raw = u8.subarray(start, start + compSize);
    if (method === 0) out.push({ name, data: raw.slice() });
    else if (method === 8) out.push({ name, data: await inflateRaw(raw) });
  }
  return out;
}
