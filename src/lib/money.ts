export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100
}

/** Order total math used by editor + draft creation */
export function orderTotals(items: { price: number; quantity: number; totalDiscount?: number }[], shipping: number, discountAmount = 0, taxRate = 0.08) {
  const subtotal = roundMoney(items.reduce((s, li) => s + li.price * li.quantity - (li.totalDiscount ?? 0), 0))
  const taxTotal = roundMoney((subtotal - discountAmount) * taxRate)
  const total = roundMoney(subtotal - discountAmount + shipping + taxTotal)
  return { subtotal, taxTotal, total }
}
