/** Before/after values for only the fields that actually changed (used as audit metadata). */
export function changedFields(before: Record<string, unknown>, patch: Record<string, unknown>) {
  const b: Record<string, unknown> = {};
  const a: Record<string, unknown> = {};
  for (const k of Object.keys(patch)) {
    if (patch[k] !== undefined && before[k] !== patch[k]) {
      b[k] = before[k] ?? null;
      a[k] = patch[k] ?? null;
    }
  }
  return { before: b, after: a, changed: Object.keys(a).length > 0 };
}
