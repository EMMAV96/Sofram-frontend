import type { BlobResponse } from './apiClient';

function pdfFilename(header: string | null, fallback: string): string {
  const encoded = header?.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)?.[1];
  const plain = header?.match(/filename\s*=\s*(?:"([^"]+)"|([^;]+))/i);
  let name = plain?.[1] ?? plain?.[2] ?? fallback;
  if (encoded) {
    try { name = decodeURIComponent(encoded.trim()); } catch { /* Use the plain name or fallback. */ }
  }
  name = name.trim().split(/[\\/]/).pop()?.replace(/[\x00-\x1f\x7f<>:"|?*]/g, '') ?? '';
  return name.toLowerCase().endsWith('.pdf') ? name : fallback;
}

export function downloadPdf(response: BlobResponse, fallback: string): void {
  const url = URL.createObjectURL(response.blob);
  const link = document.createElement('a');
  try {
    link.href = url;
    link.download = pdfFilename(response.contentDisposition, fallback);
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(url);
  }
}
