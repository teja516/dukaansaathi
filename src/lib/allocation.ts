/**
 * Splits a payment across open items in the order given (oldest first = FIFO, the default allocation:
 * spec 21.1 and 21.2). Never allocates more than an item still owes. Anything left over is NOT carried
 * silently: callers reject a payment larger than the total owed before calling this.
 */
export function allocateInOrder<T extends { id: string; remainingAmountPaise: number }>(
  items: T[],
  amountPaise: number,
): { id: string; amountPaise: number }[] {
  const out: { id: string; amountPaise: number }[] = [];
  let left = amountPaise;
  for (const item of items) {
    if (left <= 0) break;
    if (item.remainingAmountPaise <= 0) continue;
    const take = Math.min(left, item.remainingAmountPaise);
    out.push({ id: item.id, amountPaise: take });
    left -= take;
  }
  return out;
}
