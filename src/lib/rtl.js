/**
 * Persian RTL text helpers for jsPDF.
 *
 * jsPDF (>= 2.x) already reshapes Arabic/Persian letters and applies bidi
 * reordering inside `text()`, so text must be passed in logical order and is
 * laid out right-to-left by `{ align: 'right' }`. `toVisual` therefore only
 * normalises to a string — it intentionally does not reorder anything, since
 * doing so would double-reverse the glyphs.
 */
export const toVisual = (text) => String(text)

/** Wraps logical text to `maxWidth` using the doc's current font. */
export function wrapText(doc, text, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (!current || doc.getTextWidth(candidate) <= maxWidth) {
      current = candidate
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}
