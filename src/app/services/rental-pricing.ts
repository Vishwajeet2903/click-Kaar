export function rentalDiscountPercent(days: number): number {
  if (days >= 7) return 20;
  if (days >= 5) return 15;
  if (days >= 2) return 5;
  return 0;
}

export function discountedRentalPrice(dailyPrice: number, days: number, quantity = 1): number {
  const safeDays = Math.max(1, Math.floor(days));
  const safeQuantity = Math.max(1, Math.floor(quantity));
  const baseTotal = dailyPrice * safeDays * safeQuantity;
  const discountPercent = rentalDiscountPercent(safeDays);
  return Math.round(baseTotal * (1 - discountPercent / 100));
}