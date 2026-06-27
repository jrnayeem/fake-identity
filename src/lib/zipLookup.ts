// ── ZIP Code Lookup ───────────────────────────────────────────────────────────
// Uses the free Zippopotam.us API (no key required, CORS-enabled).

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Area codes by US state ────────────────────────────────────────────────────
const US_AREA_CODES: Record<string, string[]> = {
  AL: ["205","251","256","334"], AK: ["907"], AZ: ["480","520","602","623","928"],
  AR: ["479","501","870"], CA: ["213","310","323","415","424","510","619","626","650","714","760","805","818","858","909","916","949"],
  CO: ["303","719","720","970"], CT: ["203","860"], DE: ["302"],
  FL: ["239","305","321","352","407","561","727","772","786","813","850","863","904","941","954"],
  GA: ["229","404","470","478","678","706","770","912"], HI: ["808"],
  ID: ["208"], IL: ["217","312","331","618","630","708","773","815","847"],
  IN: ["260","317","574","765","812"], IA: ["319","515","563","712"],
  KS: ["316","620","785","913"], KY: ["270","502","606","859"],
  LA: ["225","318","337","504","985"], ME: ["207"],
  MD: ["240","301","410","443"], MA: ["339","413","508","617","781","978"],
  MI: ["231","248","313","517","616","734","810","906","989"],
  MN: ["218","320","507","612","651","763","952"], MS: ["228","601","662"],
  MO: ["314","417","573","636","816"], MT: ["406"], NE: ["308","402"],
  NV: ["702","725","775"], NH: ["603"], NJ: ["201","609","732","856","862","908","973"],
  NM: ["505","575"], NY: ["212","315","332","347","516","518","585","607","631","646","716","718","845","914","917","929"],
  NC: ["252","336","704","828","910","919","980"], ND: ["701"],
  OH: ["216","234","330","419","440","513","567","614","740","937"],
  OK: ["405","539","580","918"], OR: ["503","541","971"],
  PA: ["215","267","412","484","570","610","717","724","814"],
  RI: ["401"], SC: ["803","843","864"], SD: ["605"],
  TN: ["423","615","731","865","901","931"], TX: ["210","214","281","346","361","409","469","512","682","713","737","806","817","832","903","915","936","956","972"],
  UT: ["385","435","801"], VT: ["802"], VA: ["276","434","540","571","703","757","804"],
  WA: ["206","253","360","425","509"], WV: ["304","681"],
  WI: ["262","414","608","715","920"], WY: ["307"], DC: ["202"],
  PR: ["787","939"], GU: ["671"], VI: ["340"],
};

// ── International calling codes ───────────────────────────────────────────────
const CALLING_CODES: Record<string, string> = {
  US: "+1", CA: "+1", GB: "+44", DE: "+49", FR: "+33", IT: "+39",
  ES: "+34", NL: "+31", PL: "+48", PT: "+351", SE: "+46", NO: "+47",
  DK: "+45", FI: "+358", AT: "+43", CH: "+41", BE: "+32", CZ: "+420",
  SK: "+421", HU: "+36", RO: "+40", BG: "+359", HR: "+385", SI: "+386",
  LT: "+370", LV: "+371", EE: "+372", IE: "+353", AU: "+61", GR: "+30",
  RS: "+381", NZ: "+64", MX: "+52", BR: "+55", ZA: "+27", JP: "+81",
  SG: "+65", IN: "+91", CN: "+86",
};

// ── Street name pools per locale ──────────────────────────────────────────────
const STREET_POOLS: Record<string, { prefix: string[]; suffix: string[] }> = {
  US: {
    prefix: ["Main","Oak","Maple","Cedar","Pine","Elm","Washington","Lincoln","Park","Lake","Hill","Church","Sunset","Riverside","Broadway","Madison","Jefferson","Adams","Harrison","Monroe","Willow","Birch","Cherry","Spruce","Poplar","Ash","Walnut","Chestnut","Laurel","Holly"],
    suffix: ["St","Ave","Blvd","Dr","Rd","Ln","Way","Ct","Pl","Terrace","Circle","Loop"],
  },
  GB: {
    prefix: ["High","Church","Victoria","King","Queen","Park","Station","Manor","Green","Mill","School","Bridge","Market","Castle","North","South","East","West","London","Oxford","Bath","York"],
    suffix: ["Street","Road","Lane","Avenue","Close","Drive","Gardens","Way","Place","Crescent","Row","Mews"],
  },
  DE: {
    prefix: ["Haupt","Kirch","Schul","Bahnhof","Garten","Wald","Berg","Bach","Tal","Feld","Wiesen","Mühlen","Birken","Linden","Eichen","Buchen","Ahorn","Kastanien","Rosen","Blumen"],
    suffix: ["straße","gasse","allee","weg","platz","ring","damm","pfad"],
  },
  FR: {
    prefix: ["Grande Rue","Rue de la Paix","Avenue Montaigne","Boulevard Haussmann","Rue du Faubourg","Rue des Fleurs","Allée des Roses","Chemin du Moulin","Impasse du Château","Passage des Arts","Rue Victor Hugo","Avenue de la République","Boulevard du Général"],
    suffix: [],
  },
  IT: {
    prefix: ["Via Roma","Via Garibaldi","Corso Vittorio","Via Mazzini","Piazza Navona","Via del Corso","Via Veneto","Viale Delle Rose","Via Dante","Via Nazionale","Corso Italia","Via Cavour","Piazza della Repubblica"],
    suffix: [],
  },
  ES: {
    prefix: ["Calle Mayor","Gran Vía","Paseo de la Castellana","Calle de Alcalá","Avenida de América","Calle del Sol","Paseo de Gracia","Rambla de Catalunya","Calle Nueva","Calle Real","Avenida Principal","Calle de la Paz"],
    suffix: [],
  },
  NL: {
    prefix: ["Kerk","Hoofd","Markt","Molenweg","Linden","Eiken","Beek","Bos","Veld","Dijk","Wijk","Brug","School"],
    suffix: ["straat","laan","weg","plein","gracht","kade","steeg","pad"],
  },
  PL: {
    prefix: ["ul. Główna","ul. Kościelna","ul. Szkolna","ul. Parkowa","ul. Leśna","ul. Polna","ul. Słoneczna","ul. Lipowa","ul. Dębowa","ul. Wierzbowa","al. Krakowska","al. Warszawska","ul. Mickiewicza"],
    suffix: [],
  },
  DEFAULT: {
    prefix: ["Central","North","South","East","West","Grand","New","Old","Upper","Lower","Royal","National","Municipal"],
    suffix: ["Street","Avenue","Road","Lane","Boulevard","Drive","Way","Place"],
  },
};

function getLocale(countryCode: string): string {
  if (["US","CA","AU","NZ"].includes(countryCode)) return "US";
  if (["GB","IE"].includes(countryCode)) return "GB";
  if (["DE","AT","CH"].includes(countryCode)) return "DE";
  if (["FR","BE","LU"].includes(countryCode)) return "FR";
  if (["IT"].includes(countryCode)) return "IT";
  if (["ES"].includes(countryCode)) return "ES";
  if (["NL"].includes(countryCode)) return "NL";
  if (["PL"].includes(countryCode)) return "PL";
  return "DEFAULT";
}

function generateStreetAddress(countryCode: string, city: string): string {
  const locale = getLocale(countryCode);
  const pool = STREET_POOLS[locale] ?? STREET_POOLS.DEFAULT;
  const num = rnd(1, 9999);

  if (locale === "DE") {
    const name = pick(pool.prefix);
    const suffix = pick(pool.suffix);
    return `${name}${suffix} ${num}`;
  }
  if (["FR","IT","ES","PL"].includes(locale) && pool.suffix.length === 0) {
    return `${pick(pool.prefix)} ${num}`;
  }
  if (pool.suffix.length > 0) {
    return `${num} ${pick(pool.prefix)} ${pick(pool.suffix)}`;
  }
  return `${num} ${pick(pool.prefix)}`;
}

function formatPhone(countryCode: string, stateCode: string): string {
  const calling = CALLING_CODES[countryCode] ?? "+1";

  if (countryCode === "US" || countryCode === "CA") {
    const areaCodes = US_AREA_CODES[stateCode] ?? ["800"];
    const area = pick(areaCodes);
    const line1 = String(rnd(200, 999));
    const line2 = String(rnd(1000, 9999));
    return `(${area}) ${line1}-${line2}`;
  }

  // Generic international format
  const local = Array.from({ length: rnd(7, 9) }, () => rnd(0, 9)).join("");
  // Group digits nicely
  const groups = local.match(/.{1,3}/g) ?? [local];
  return `${calling} ${groups.join(" ")}`;
}

function mapsUrl(street: string, city: string, state: string, zip: string, country: string): string {
  const q = encodeURIComponent(`${street}, ${city}, ${state} ${zip}, ${country}`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

// ── Result types ──────────────────────────────────────────────────────────────

export interface ZipAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone: string;
  mapsUrl: string;
}

export interface ZipLookupResult {
  postCode: string;
  country: string;
  countryCode: string;
  city: string;
  state: string;
  stateCode: string;
  latitude: string;
  longitude: string;
  areaCodes: string[];
  addresses: ZipAddress[];
}

// ── Main lookup function ──────────────────────────────────────────────────────

export async function lookupZip(
  zip: string,
  countryCode: string = "US"
): Promise<ZipLookupResult> {
  const code = countryCode.toLowerCase();
  const res = await fetch(`https://api.zippopotam.us/${code}/${zip.trim()}`);
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? `ZIP code "${zip}" not found for ${countryCode}. Try a different code or country.`
        : `Lookup failed (HTTP ${res.status}). Check your connection and try again.`
    );
  }

  const data = await res.json();
  const place = data.places?.[0];
  if (!place) throw new Error("No location data returned for this ZIP code.");

  const city      = place["place name"] ?? "";
  const state     = place["state"] ?? "";
  const stateCode = place["state abbreviation"] ?? countryCode;
  const lat       = place["latitude"] ?? "";
  const lon       = place["longitude"] ?? "";

  // Determine area codes
  let areaCodes: string[] = [];
  if (countryCode === "US") {
    areaCodes = US_AREA_CODES[stateCode] ?? ["800"];
  } else if (countryCode === "CA") {
    areaCodes = US_AREA_CODES[stateCode] ?? ["800"];
  } else {
    areaCodes = [CALLING_CODES[countryCode]?.replace("+", "") ?? "1"];
  }

  // Generate 5 realistic addresses
  const addresses: ZipAddress[] = Array.from({ length: 5 }, () => {
    const street = generateStreetAddress(countryCode, city);
    return {
      street,
      city,
      state,
      zip,
      country: data.country ?? countryCode,
      phone: formatPhone(countryCode, stateCode),
      mapsUrl: mapsUrl(street, city, state, zip, data.country ?? countryCode),
    };
  });

  return {
    postCode:    zip,
    country:     data.country ?? countryCode,
    countryCode: countryCode.toUpperCase(),
    city,
    state,
    stateCode,
    latitude:    lat,
    longitude:   lon,
    areaCodes,
    addresses,
  };
}

// Country options supported by the Zippopotam.us API
export const SUPPORTED_COUNTRIES = [
  { code: "US", name: "🇺🇸 United States" },
  { code: "CA", name: "🇨🇦 Canada" },
  { code: "GB", name: "🇬🇧 United Kingdom" },
  { code: "DE", name: "🇩🇪 Germany" },
  { code: "FR", name: "🇫🇷 France" },
  { code: "IT", name: "🇮🇹 Italy" },
  { code: "ES", name: "🇪🇸 Spain" },
  { code: "NL", name: "🇳🇱 Netherlands" },
  { code: "PL", name: "🇵🇱 Poland" },
  { code: "PT", name: "🇵🇹 Portugal" },
  { code: "SE", name: "🇸🇪 Sweden" },
  { code: "NO", name: "🇳🇴 Norway" },
  { code: "DK", name: "🇩🇰 Denmark" },
  { code: "FI", name: "🇫🇮 Finland" },
  { code: "AT", name: "🇦🇹 Austria" },
  { code: "CH", name: "🇨🇭 Switzerland" },
  { code: "BE", name: "🇧🇪 Belgium" },
  { code: "CZ", name: "🇨🇿 Czech Republic" },
  { code: "SK", name: "🇸🇰 Slovakia" },
  { code: "HU", name: "🇭🇺 Hungary" },
  { code: "RO", name: "🇷🇴 Romania" },
  { code: "HR", name: "🇭🇷 Croatia" },
  { code: "SI", name: "🇸🇮 Slovenia" },
  { code: "IE", name: "🇮🇪 Ireland" },
  { code: "AU", name: "🇦🇺 Australia" },
  { code: "NZ", name: "🇳🇿 New Zealand" },
  { code: "JP", name: "🇯🇵 Japan" },
  { code: "IN", name: "🇮🇳 India" },
  { code: "MX", name: "🇲🇽 Mexico" },
  { code: "BR", name: "🇧🇷 Brazil" },
  { code: "ZA", name: "🇿🇦 South Africa" },
];
