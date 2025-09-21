import fileService from "../services/file-service";

// Memory cache for preview blobs/URLs or text content
const previewCache: Record<
  string,
  { content: string | null; url: string | null; expires: number }
> = {};

export async function previewFile(
  fileId: string,
  ownerId: string,
  fileName: string
) {
  try {
    const now = Date.now();

    // Check cache
    if (previewCache[fileId] && previewCache[fileId].expires > now) {
      openPreview(fileName, previewCache[fileId]);
      return;
    }

    const { downloadUrl } = await fileService.fetchDownloadUrl(fileId, ownerId);

    const response = await fetch(downloadUrl);
    const blob = await response.blob();

    let previewUrl: string | null = null;
    let textContent: string | null = null;

    const previewContent = document.getElementById("previewContent")!;
    // if (!previewContent) return;
    previewContent.innerHTML = ""; // clear old preview

    if (
      fileName.endsWith(".png") ||
      fileName.endsWith(".jpg") ||
      fileName.endsWith(".jpeg")
    ) {
      const img = document.createElement("img");
      previewUrl = URL.createObjectURL(blob);
      img.src = previewUrl;
      img.className = "max-w-full max-h-[70vh] mx-auto";
      previewContent.appendChild(img);
    } else if (
      fileName.endsWith(".js") ||
      fileName.endsWith(".txt") ||
      fileName.endsWith(".json")
    ) {
      textContent = await blob.text();
      const pre = document.createElement("pre");
      pre.className = "whitespace-pre-wrap bg-gray-100 p-4 rounded";
      pre.textContent = textContent;
      previewContent.appendChild(pre);
    } else {
      previewContent.innerHTML = `<div class="text-gray-600">Preview not supported for this file type.</div>`;
    }

    // Cache the content
    previewCache[fileId] = {
      url: previewUrl,
      content: textContent,
      expires: now + 5 * 60 * 1000,
    };

    // Show modal
    document.getElementById("previewModal")!.classList.remove("hidden");
    document.getElementById("previewTitle")!.innerText = fileName;
  } catch (err) {
    console.error("Preview failed:", err);
  }
}

function canPreview(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return (
    lower.endsWith(".png") ||
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".txt") ||
    lower.endsWith(".json") ||
    lower.endsWith(".js")
  );
}

// Helper to open cached content
function openPreview(
  fileName: string,
  cache: { url: string | null; content: string | null }
) {
  const previewContent = document.getElementById("previewContent")!;
  previewContent.innerHTML = "";

  if (cache.url) {
    const img = document.createElement("img");
    img.src = cache.url;
    img.className = "max-w-full max-h-[70vh] mx-auto";
    previewContent.appendChild(img);
  } else if (cache.content) {
    const pre = document.createElement("pre");
    pre.className = "whitespace-pre-wrap bg-gray-100 p-4 rounded";
    pre.textContent = cache.content;
    previewContent.appendChild(pre);
  } else {
    previewContent.innerHTML = `<div class="text-gray-600">Preview loaded from cache</div>`;
  }

  document.getElementById("previewModal")!.classList.remove("hidden");
  document.getElementById("previewTitle")!.innerText = fileName;
}
