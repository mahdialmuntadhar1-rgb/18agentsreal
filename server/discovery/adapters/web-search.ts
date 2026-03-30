export type SearchSnippet = {
  title: string;
  url: string;
  snippet: string;
};

export async function searchSnippets(query: string, limit = 10): Promise<SearchSnippet[]> {
  const url = `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!response.ok) return [];

  const html = await response.text();
  const resultRegex = /<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>[\s\S]*?<a[^>]*class="result__snippet"[^>]*>(.*?)<\/a>/g;

  const results: SearchSnippet[] = [];
  let match: RegExpExecArray | null;
  while ((match = resultRegex.exec(html)) !== null && results.length < limit) {
    const clean = (s: string) => s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    const rawUrl = decodeURIComponent(match[1]);
    const uddg = rawUrl.match(/[?&]uddg=([^&]+)/)?.[1];

    results.push({
      title: clean(match[2]),
      url: uddg ? decodeURIComponent(uddg) : rawUrl,
      snippet: clean(match[3]),
    });
  }

  return results;
}

export function extractFirstPhone(text: string): string | null {
  const m = text.match(/(\+?964|0)\s?7\d{2}[\s-]?\d{3}[\s-]?\d{4}/);
  return m ? m[0] : null;
}
