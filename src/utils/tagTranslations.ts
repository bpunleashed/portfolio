export interface TagTranslation {
  en: string;
  sk: string;
}

export const TAG_MAP: Record<string, TagTranslation> = {
  // Filmové zložky
  "directing": { en: "Directing", sk: "Réžia" },
  "camera": { en: "Camera (DP)", sk: "Kamera" },
  "video-editing": { en: "Video Editing", sk: "Strih videa" },
  "location-sound": { en: "Location Sound", sk: "Lokačný zvuk" },
  "sound-design": { en: "Sound Design", sk: "Zvukový dizajn" },
  "grip": { en: "Grip", sk: "Grip" },
  "storyboarding": { en: "Storyboarding", sk: "Storyboarding" },

  // Foto
  "photography": { en: "Photography", sk: "Fotografia" },
  "photo-editing": { en: "Photo Editing", sk: "Úprava fotiek" },

  // Animácia a rekvizity (Tvoja špecializácia)
  "stop-motion": { en: "Stop-Motion", sk: "Stop-motion animácia" },
  "prop-making": { en: "Prop Making", sk: "Výroba rekvizít" },
  "woodworking": { en: "Woodworking", sk: "Práca s drevom" },
  "painting": { en: "Painting", sk: "Maľba / Výtvarné umenie" },
  "sewing": { en: "Sewing / Costumes", sk: "Kostýmy / Šitie" },

  // Ostatné
  "event-management": { en: "Event Management", sk: "Event produkcia" },
  "stage-presence": { en: "Stage Presence", sk: "Javisková tvorba" },
  "craft-services": { en: "Craft Services", sk: "Servis na pľaci" },
};

/**
 * Pomocná funkcia, ktorá vráti správny preklad tagu.
 * Ak tag v slovníku nenájde, vráti pôvodný string ako fallback.
 */
export function getTagLabel(rawTag: string, lang: "sk" | "en" = "sk"): string {
  // Normalizácia reťazca (napr. "Strih videa" -> "video-editing", "Woodwork" -> "woodworking")
  const slug = rawTag.toLowerCase().trim().replace(/\s+/g, "-");

  // Aliasy pre tvoje existujúce duplicity v databáze:
  const aliases: Record<string, string> = {
    "strih-videa": "video-editing",
    "editing": "video-editing",
    "woodwork": "woodworking",
    "sound-engineering": "sound-design",
    "zvukový-dizajn": "sound-design",
    "réžia": "directing",
    "video-recording": "camera",
  };

  const key = aliases[slug] || slug;
  return TAG_MAP[key]?.[lang] || rawTag;
}

/**
 * Normalizuje tag na interný kľúč pre filtrovanie (napr. pre data-tag="")
 */
export function normalizeTag(rawTag: string): string {
  const slug = rawTag.toLowerCase().trim().replace(/\s+/g, "-");
  const aliases: Record<string, string> = {
    "strih-videa": "video-editing",
    "editing": "video-editing",
    "woodwork": "woodworking",
    "sound-engineering": "sound-design",
    "zvukový-dizajn": "sound-design",
    "réžia": "directing",
    "video-recording": "camera",
  };
  return aliases[slug] || slug;
}