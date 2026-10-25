export interface ParsedProjectData {
  title_en: string;
  title_sk: string;
  slug: string;
  date: string;
  duration?: string;
  place?: string;
  venue?: string;
  client?: string;
  skills?: string;
  collaborators?: string;
  tagline_en?: string;
  tagline_sk?: string;
  story_en?: string;
  story_sk?: string;
  btsText?: string;
  galleryText?: string;
  heroUrl?: string;
  teaserUrl?: string;
}

// Pomocná funkcia: vytvorenie bezpečného URL slugu bez diakritiky
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Odstráni mäkčene a dĺžne
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')   // Vymaže úvodzovky a špeciálne znaky
    .replace(/[\s_-]+/g, '-')       // Medzery nahradí pomlčkou
    .replace(/^-+|-+$/g, '');
}

export function parseSmartText(raw: string): ParsedProjectData {
  if (!raw || !raw.trim()) {
    return { title_en: '', title_sk: '', slug: '', date: '' };
  }

  const cleanRaw = raw.replace(/^---\s*[\r\n]+/, '').replace(/[\r\n]+---\s*$/, '');
  const lines = cleanRaw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  const result: ParsedProjectData = {
    title_en: '',
    title_sk: '',
    slug: '',
    date: '',
    place: '',
    venue: '',
    client: '',
    skills: '',
    collaborators: '',
    tagline_en: '',
    tagline_sk: '',
    story_en: '',
    story_sk: '',
  };

  // 1. REŽIM KĽÚČ-HODNOTA (Ak text obsahuje explicitné kľúče napr. "Title SK: ...")
  const extract = (pattern: string): string | null => {
    const m = cleanRaw.match(new RegExp(`(?:${pattern})\\s*:\\s*(.*)`, 'i'));
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
  };

  if (cleanRaw.includes(':') && /(title_sk|názov|title_en|skills|zručnosti)/i.test(cleanRaw)) {
    result.title_en = extract('title_en|title en|english title') || '';
    result.title_sk = extract('title_sk|title sk|slovak title|názov|nazov') || '';
    result.date = extract('date|dátum|datum|rok|year|timeline') || '';
    result.client = extract('client|klient|produkcia|production') || '';
    result.skills = extract('skills|tags|zručnosti|zrucnosti|roly') || '';
    result.collaborators = extract('collaborators|spolupráca|spolupraca|štáb|crew') || '';
    result.place = extract('place|location|miesto|lokalita') || '';
    result.venue = extract('venue|miesto konania|priestor') || '';
  }

  // 2. HEURISTICKÝ REŽIM (Voľný text v ľubovoľnom poradí z Notepadu)
  const unassignedLines: string[] = [];

  for (const line of lines) {
    if (/^(title_sk|title_en|skills|client|date|venue|place):/i.test(line)) continue;

    // Hľadanie ROKU
    if (!result.date && /^((19|20)\d{2})(\s*[-–]\s*(19|20)\d{2})?$/.test(line)) {
      result.date = line;
      continue;
    }

    // Hľadanie SPOLUPRACOVNÍKOV / TIRÁŽE
    if (/(autor|dramaturgia|obsadenie|hrajú|réžia|kamera|zvuk|strih|cast|directed by|written by):/i.test(line)) {
      result.collaborators = result.collaborators ? `${result.collaborators}, ${line}` : line;
      continue;
    }

    // Hľadanie KLIENTA / INŠTITÚCIE
    if (!result.client && /(divadlo|theatre|studio|galéria|kunsthalle|s\.r\.o\.|kft\.|tv\b|aliancia|festival)/i.test(line)) {
      result.client = line;
      continue;
    }

    unassignedLines.push(line);
  }

  // 3. ROZDELENIE NÁZVOV (Slovenčina vs. Angličtina)
  const hasSlovakDiacritics = (str: string) => /[áäčďéíĺľňóôŕšťúýž]/i.test(str);
  const hasEnglishWords = (str: string) => /\b(the|of|in|and|man|green|adventures|short|film|night)\b/i.test(str);

  if (unassignedLines.length === 1) {
    const single = unassignedLines[0];
    if (hasSlovakDiacritics(single)) {
      result.title_sk = single;
    } else {
      result.title_sk = single;
      result.title_en = single;
    }
  } else if (unassignedLines.length >= 2) {
    const l1 = unassignedLines[0];
    const l2 = unassignedLines[1];

    if (hasSlovakDiacritics(l1) || hasEnglishWords(l2)) {
      result.title_sk = l1;
      result.title_en = l2;
    } else if (hasSlovakDiacritics(l2) || hasEnglishWords(l1)) {
      result.title_sk = l2;
      result.title_en = l1;
    } else {
      result.title_sk = l1;
      result.title_en = l2;
    }
  }

  // 4. BEZPEČNÝ SLUG A TAGY
  const mainTitle = result.title_sk || result.title_en;
  if (mainTitle && !result.slug) {
    result.slug = slugify(mainTitle);
  }

  if (!result.skills && /divadlo/i.test(cleanRaw)) {
    result.skills = 'Záznam predstavenia, Kamera, Strih videa';
  }

  return result;
}