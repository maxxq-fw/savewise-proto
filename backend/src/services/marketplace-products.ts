export interface MarketplaceProduct {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  priceSave: string;
  category: "protocol" | "partner";
  material: boolean;
}

export const materialMarketplaceProducts: MarketplaceProduct[] = [
  {
    id: "PYATEROCHKA_10_1000",
    title: "Скидка 10% в Пятёрочке",
    subtitle: "на покупку от 1000 ₽",
    description:
      "Партнерский купон для продуктовых покупок: пользователь тратит SAVE и получает персональный код скидки.",
    priceSave: "10",
    category: "partner",
    material: true
  },
  {
    id: "COFFEE_CERTIFICATE",
    title: "Сертификат на кофе",
    subtitle: "напиток в кофейне-партнере",
    description:
      "Cертификат на кофе. Демонстрирует обмен SAVE на повседневный потребительский бонус.",
    priceSave: "6",
    category: "partner",
    material: true
  },
  {
    id: "TBANK_CASHBACK_CATEGORY",
    title: "+1 категория кешбэка в Т-Банке",
    subtitle: "дополнительная категория на месяц",
    description:
      "Финансовый бонус: пользователь обменивает SAVE на расширение программы кешбэка в банковском приложении.",
    priceSave: "12",
    category: "partner",
    material: true
  }
];

export function getMaterialProduct(productId: string) {
  return materialMarketplaceProducts.find((product) => product.id === productId);
}

export function createVoucherCode(productId: string) {
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SAVE-${productId.split("_")[0]}-${suffix}`;
}
