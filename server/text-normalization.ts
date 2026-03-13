const REPLACEMENTS: Array<[RegExp, string]> = [
  [/\u00D8\u00A7/g, "ا"],
  [/\u00D8\u00A8/g, "ب"],
  [/\u00D9\u008A/g, "ي"],
  [/\u00D9\u0083/g, "ك"],
  [/\u00D8\u00A9/g, "ة"],
  [/\u00DB\u008E/g, "ە"],
  [/\u00DB\u008C/g, "ی"],
  [/\u00DA\u00A9/g, "ک"],
];

function fixCommonMojibake(input: string): string {
  let output = input;
  for (const [pattern, replacement] of REPLACEMENTS) {
    output = output.replace(pattern, replacement);
  }
  return output;
}

function normalizeSpacing(input: string): string {
  return input
    .replace(/\u200F|\u200E/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeMultilingualText(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  return normalizeSpacing(fixCommonMojibake(value.normalize("NFC")));
}

export function normalizeUrl(value: string | null | undefined): string | null {
  const normalized = normalizeMultilingualText(value);
  if (!normalized) {
    return null;
  }

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  return `https://${normalized}`;
}
