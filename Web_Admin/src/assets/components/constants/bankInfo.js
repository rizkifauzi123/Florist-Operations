// src/assets/components/constants/bankInfo.js

export const BANK_INFO = {
  "Mandiri":         { norek: "118 00 xxxx xxxx",            label: "BANK MANDIRI a.n Dede Syarifah", isCash: false },
  "BRI":             { norek: "1767 xxxx xxx x  x",           label: "BRI a.n Miskam",                 isCash: false },
  "BCA":             { norek: "24xxxxxxx",                   label: "BCA a.n Dede Syarifah",          isCash: false },
  "BNI":             { norek: "125 xx xxxx",                 label: "BNI a.n Dede Syarifah",          isCash: false },
  "BSI":             { norek: "7124 xxx xxxx",                   label: "BSI a.n Miskam",                 isCash: false },
  "BTN":             { norek: "002114 xxxxxx",             label: "BANK BTN a.n Dede Syarifah",     isCash: false },
  "Bank Maluku Malut": { norek: "165xxxxx xxxx",                 label: "BANK MALUKU MALUT a.n Miskam",   isCash: false },
   // ← Ganti placeholder di bawah dengan data asli
  "DJPB":              {
    norek:  "32xxxxxxxxx",   label:  "BANK MANDIRI a.n Dede Syarifah",
    norek2: "325 xxxxxxxxx",   label2: "BRI a.n Miskam",
    isCash: false,
  },
  "Tunai":           { norek: null,                           label: "PEMBAYARAN TUNAI",               isCash: true  },
};

/**
 * Ambil info bank dari nilai yang tersimpan di DB.
 * Bisa terima key pendek ("Mandiri") atau label lama ("BANK MANDIRI a.n Dede Syarifah")
 */
export const getBankInfo = (bankValue) => {
  if (!bankValue) return { norek: "", label: "", isCash: false };

  // Match langsung ke key pendek
  if (BANK_INFO[bankValue]) return BANK_INFO[bankValue];

  // Fallback: cocokkan berdasarkan label (backward compatible data lama)
  const found = Object.values(BANK_INFO).find(
    (b) => b.label?.toLowerCase() === bankValue.toLowerCase()
  );
  if (found) return found;

  // Custom / Other — tampilkan apa adanya sebagai norek & label
  return { norek: bankValue, label: bankValue, isCash: false };
};