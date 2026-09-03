/**
 * Test helpers. Not exported from the package; `tsconfig.lib.json` excludes
 * this directory from the published build.
 *
 * `noUncheckedIndexedAccess` is on for the whole repository, which is right: an
 * index into a live NodeList genuinely can miss. In a spec the miss is the
 * failure worth reporting, so these narrow the type by asserting rather than by
 * a non-null operator that would report `Cannot read properties of undefined`
 * from three frames away.
 */

export function at<T>(items: readonly T[], index: number, what = 'element'): T {
  const item = items[index];
  if (item === undefined) {
    throw new Error(`expected a ${what} at index ${index}, found ${items.length} in total`);
  }
  return item;
}
