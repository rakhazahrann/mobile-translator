import { TranslateInput, TranslateResult } from "../types";
import { config } from "../config";

const AUTO_SOURCE = "auto";

async function translateGoogle(
  input: TranslateInput
): Promise<TranslateResult> {
  const { text, sourceLanguage, targetLanguage } = input;
  const sl =
    sourceLanguage === AUTO_SOURCE
      ? AUTO_SOURCE
      : normalizeGoogleLang(sourceLanguage);
  const tl = normalizeGoogleLang(targetLanguage);

  const params = new URLSearchParams({
    client: "gtx",
    sl,
    tl,
    dt: "t",
    q: text,
  });

  const response = await fetch(`${config.google.apiUrl}?${params}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Translation failed: ${response.status}`);
  }

  const data = await response.json();

  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("Unexpected response format");
  }

  const translatedText = data[0]
    .filter((segment: unknown[]) => segment && segment[0])
    .map((segment: unknown[]) => segment[0])
    .join("");

  if (!translatedText) {
    throw new Error("No translation returned");
  }

  const detectedLanguage =
    sl === AUTO_SOURCE && typeof data[2] === "string"
      ? normalizeGoogleLang(data[2])
      : undefined;

  return detectedLanguage
    ? { translatedText, detectedLanguage }
    : { translatedText };
}

function normalizeGoogleLang(code: string): string {
  const map: Record<string, string> = {
    "zh-CN": "zh-CN",
    "zh-TW": "zh-TW",
  };
  return map[code] ?? code;
}

async function translateMyMemory(
  input: TranslateInput
): Promise<TranslateResult> {
  const { text, sourceLanguage, targetLanguage } = input;
  const langpair = `${sourceLanguage}|${targetLanguage}`;
  let url = `${config.mymemory.apiUrl}?q=${encodeURIComponent(text)}&langpair=${encodeURIComponent(langpair)}`;
  if (config.mymemory.email) {
    url += `&de=${encodeURIComponent(config.mymemory.email)}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Translation failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.responseStatus !== 200) {
    throw new Error(data.responseDetails || "Translation failed");
  }

  return { translatedText: data.responseData.translatedText };
}

async function translateLibreTranslate(
  input: TranslateInput
): Promise<TranslateResult> {
  const { text, sourceLanguage, targetLanguage } = input;

  const body: Record<string, string> = {
    q: text,
    source: sourceLanguage,
    target: targetLanguage,
    format: "text",
  };
  if (config.libretranslate.apiKey) {
    body.api_key = config.libretranslate.apiKey;
  }

  const response = await fetch(config.libretranslate.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Translation failed: ${response.status}`);
  }

  const data = await response.json();
  return { translatedText: data.translatedText };
}

export async function translateText(
  input: TranslateInput
): Promise<TranslateResult> {
  if (!input.text.trim()) {
    throw new Error("Text cannot be empty");
  }

  switch (config.provider) {
    case "google":
      return translateGoogle(input);
    case "libretranslate":
      return translateLibreTranslate(input);
    case "mymemory":
    default:
      return translateMyMemory(input);
  }
}
