import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "Dashboard": "Dashboard",
      "POS Terminal": "POS Terminal",
      "Inventory": "Inventory",
      "Transactions": "Transactions",
      "Expenses": "Expenses",
      "Customers": "Customers",
      "Stock Transfer": "Stock Transfer",
      "Settings": "Settings",
      "Welcome": "Habari",
      "Revenue": "Revenue",
      "Subtotal": "Subtotal",
      "Checkout": "Checkout",
      "Complete Transaction": "Complete Transaction"
    }
  },
  sw: {
    translation: {
      "Dashboard": "Kivinjari",
      "POS Terminal": "Mauzo",
      "Inventory": "Stoki",
      "Transactions": "Historia ya Mauzo",
      "Expenses": "Gharama",
      "Customers": "Wateja",
      "Stock Transfer": "Uhamisho wa Stoki",
      "Settings": "Mipangilio",
      "Welcome": "Habari",
      "Revenue": "Mapato",
      "Subtotal": "Jumla Kidogo",
      "Checkout": "Malipo",
      "Complete Transaction": "Kamilisha Mauzo"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
