// Search helpers shared by the order search and the customer search, so both behave the same.

/** Lowercase without accents, so "yilmaz" finds "Yılmaz", "celik" finds "Çelik" and "ELİF" finds "Elif". */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/ı/g, "i");
}

/** Digits of a search text without leading zeros: "0532 123" and "+90 532 123" both give digits to look for. */
export function phoneSearchDigits(query: string): string {
  return query.replace(/\D/g, "").replace(/^0+/, "");
}
