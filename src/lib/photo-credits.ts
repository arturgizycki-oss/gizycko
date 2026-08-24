/**
 * Photographs of Giżycko from Wikimedia Commons. Three of the four are
 * CC BY-SA, which requires visible attribution wherever they appear — that is
 * what PhotoCredit renders. Do not use one of these without its credit.
 */
export type PhotoCredit = {
  src: string;
  alt: string;
  author: string;
  licence: string;
  licenceUrl: string;
  source: string;
};

const CC_BY_SA_4 = "https://creativecommons.org/licenses/by-sa/4.0/";
const CC_BY_SA_3 = "https://creativecommons.org/licenses/by-sa/3.0/";

export const GIZYCKO_PHOTOS = {
  port: {
    src: "/gizycko/port.jpg",
    alt: "The marina at Giżycko, boats moored along the quay",
    author: "MOs810",
    licence: "CC BY-SA 4.0",
    licenceUrl: CC_BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Port_Gizycko_2020_(1).jpg",
  },
  sunset: {
    src: "/gizycko/sunset.jpg",
    alt: "Sunset over Lake Niegocin at Giżycko",
    author: "Margoz",
    licence: "CC BY-SA 4.0",
    licenceUrl: CC_BY_SA_4,
    source:
      "https://commons.wikimedia.org/wiki/File:Sunset_on_Niegocin_in_Gi%C5%BCycko.jpg",
  },
  lake: {
    src: "/gizycko/lake.jpg",
    alt: "Lake Niegocin seen from Giżycko",
    author: "Muggmag",
    licence: "Public domain",
    licenceUrl: "https://commons.wikimedia.org/wiki/Template:PD-self",
    source:
      "https://commons.wikimedia.org/wiki/File:Gi%C5%BCycko_-_widok_na_Niegocin.jpg",
  },
  marina: {
    src: "/gizycko/marina.jpg",
    alt: "Boats moored in the harbour at Giżycko",
    author: "MOs810",
    licence: "CC BY-SA 4.0",
    licenceUrl: CC_BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Port_Gizycko_2020_(2).jpg",
  },
  boyen: {
    src: "/gizycko/boyen.jpg",
    alt: "Boyen Fortress, the nineteenth-century stronghold at Giżycko",
    author: "Semu",
    licence: "CC BY-SA 4.0",
    licenceUrl: CC_BY_SA_4,
    source: "https://commons.wikimedia.org/wiki/File:Twierdza_Boyen_-_1.jpg",
  },
  bridge: {
    src: "/gizycko/bridge.jpg",
    alt: "The swing bridge in Giżycko over the Łuczański Canal",
    author: "Ludwig Schneider / Wikimedia",
    licence: "CC BY-SA 3.0",
    licenceUrl: CC_BY_SA_3,
    source:
      "https://commons.wikimedia.org/wiki/File:Gi%C5%BCycko_Most_Obrotowy_006.jpg",
  },
} satisfies Record<string, PhotoCredit>;

/** What the dashboard cycles through. */
export const DASHBOARD_PHOTOS = [
  GIZYCKO_PHOTOS.port,
  GIZYCKO_PHOTOS.marina,
  GIZYCKO_PHOTOS.boyen,
  GIZYCKO_PHOTOS.bridge,
  GIZYCKO_PHOTOS.sunset,
];
