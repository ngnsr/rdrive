export async function computeFileHash(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = crypto.subtle.digest("SHA-256", arrayBuffer);
  const hashArray = Array.from(new Uint8Array(await hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
