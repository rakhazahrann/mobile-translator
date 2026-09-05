export type TranslateProvider = "google" | "mymemory" | "libretranslate";

export const config = {
  provider: "google" as TranslateProvider,

  google: {
    apiUrl: "https://translate.googleapis.com/translate_a/single",
  },

  mymemory: {
    apiUrl: "https://api.mymemory.translated.net/get",
    email: "",
  },

  libretranslate: {
    apiUrl: "https://libretranslate.com/translate",
    apiKey: "",
  },
};
