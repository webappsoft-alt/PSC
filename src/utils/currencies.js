/**
 * Currencies offered in PSC pickers (from Create Event › Add Items) with the
 * flag (ISO country / "eu") and symbol used to show prices.
 */
export const CURRENCIES = [
  { id: "USD", title: "US Dollar", flag: "us", symbol: "$" },
  { id: "EUR", title: "Euro", flag: "eu", symbol: "€" },
  { id: "GBP", title: "British Pound", flag: "gb", symbol: "£" },

  { id: "AED", title: "UAE Dirham", flag: "ae", symbol: "AED " },
  { id: "SAR", title: "Saudi Riyal", flag: "sa", symbol: "SAR " },
  { id: "QAR", title: "Qatari Riyal", flag: "qa", symbol: "QAR " },
  { id: "KWD", title: "Kuwaiti Dinar", flag: "kw", symbol: "KWD " },

  { id: "INR", title: "Indian Rupee", flag: "in", symbol: "₹" },
  { id: "PKR", title: "Pakistani Rupee", flag: "pk", symbol: "Rs " },
  { id: "BDT", title: "Bangladeshi Taka", flag: "bd", symbol: "৳" },
  { id: "LKR", title: "Sri Lankan Rupee", flag: "lk", symbol: "Rs " },
  { id: "NPR", title: "Nepalese Rupee", flag: "np", symbol: "Rs " },

  { id: "CAD", title: "Canadian Dollar", flag: "ca", symbol: "CA$" },
  { id: "AUD", title: "Australian Dollar", flag: "au", symbol: "A$" },
  { id: "NZD", title: "New Zealand Dollar", flag: "nz", symbol: "NZ$" },

  { id: "CNY", title: "Chinese Yuan", flag: "cn", symbol: "¥" },
  { id: "JPY", title: "Japanese Yen", flag: "jp", symbol: "¥" },
  { id: "KRW", title: "South Korean Won", flag: "kr", symbol: "₩" },

  { id: "ZAR", title: "South African Rand", flag: "za", symbol: "R " },
  { id: "NGN", title: "Nigerian Naira", flag: "ng", symbol: "₦" },
  { id: "EGP", title: "Egyptian Pound", flag: "eg", symbol: "E£" },

  { id: "BRL", title: "Brazilian Real", flag: "br", symbol: "R$" },
  { id: "ARS", title: "Argentine Peso", flag: "ar", symbol: "ARS " },
  { id: "MXN", title: "Mexican Peso", flag: "mx", symbol: "MX$" },

  { id: "TRY", title: "Turkish Lira", flag: "tr", symbol: "₺" },
  { id: "CHF", title: "Swiss Franc", flag: "ch", symbol: "CHF " },
  { id: "SEK", title: "Swedish Krona", flag: "se", symbol: "SEK " },
  { id: "NOK", title: "Norwegian Krone", flag: "no", symbol: "NOK " },
  { id: "DKK", title: "Danish Krone", flag: "dk", symbol: "DKK " },
];

export const findCurrency = (id) =>
  CURRENCIES.find((c) => c.id === id) || CURRENCIES[0];
