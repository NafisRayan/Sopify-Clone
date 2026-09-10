/** Simulated network latency so loading/saving states are demonstrable. */
export function delay(ms = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Simulated failure for error-state QA (used sparingly by services). */
export function maybeFail(failure: unknown, probability = 0): void {
  if (Math.random() < probability) throw failure
}
