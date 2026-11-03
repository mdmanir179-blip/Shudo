export function convertToEmbedUrl(url: string, type: 'sheet' | 'doc'): { embedUrl: string; detectedType: 'sheet' | 'doc'; docId: string | null } {
  const trimmed = url.trim();

  // Match Google Sheets ID
  const sheetsRegex = /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/i;
  const sheetsMatch = trimmed.match(sheetsRegex);

  // Match Google Docs ID
  const docsRegex = /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/i;
  const docsMatch = trimmed.match(docsRegex);

  if (sheetsMatch && sheetsMatch[1]) {
    const docId = sheetsMatch[1];
    return {
      embedUrl: `https://docs.google.com/spreadsheets/d/${docId}/edit?usp=sharing&widget=true&headers=false&chrome=false`,
      detectedType: 'sheet',
      docId
    };
  }

  if (docsMatch && docsMatch[1]) {
    const docId = docsMatch[1];
    return {
      embedUrl: `https://docs.google.com/document/d/${docId}/edit?embedded=true`,
      detectedType: 'doc',
      docId
    };
  }

  // If not standard docs.google.com, but valid URL, check if already has query params
  try {
    const parsed = new URL(trimmed);
    return {
      embedUrl: parsed.toString(),
      detectedType: type,
      docId: null
    };
  } catch {
    return {
      embedUrl: trimmed,
      detectedType: type,
      docId: null
    };
  }
}

export function formatDateTime(isoOrDate: string | Date): string {
  try {
    const d = new Date(isoOrDate);
    if (isNaN(d.getTime())) return String(isoOrDate);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    }).format(d);
  } catch {
    return String(isoOrDate);
  }
}
