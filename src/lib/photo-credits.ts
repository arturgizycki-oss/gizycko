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

const CC_BY_SA_3 = "https://creativecommons.org/licenses/by-sa/3.0/";

export const GIZYCKO_PHOTOS = {
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
