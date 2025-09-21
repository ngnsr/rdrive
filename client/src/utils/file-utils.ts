export async function computeFileHash(
  file: File | { buffer: Uint8Array }
): Promise<string> {
  let arrayBuffer: ArrayBuffer;

  if ("arrayBuffer" in file) {
    // Normal File object
    arrayBuffer = await file.arrayBuffer();
  } else {
    // fsApi buffer
    arrayBuffer = file.buffer.buffer.slice(
      file.buffer.byteOffset,
      file.buffer.byteOffset + file.buffer.byteLength
    ) as ArrayBuffer;
  }

  const hashBuffer = await crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
