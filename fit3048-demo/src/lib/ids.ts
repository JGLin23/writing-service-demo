/**
 * Port of WritingServiceRequest::initializeWritingServiceRequestId():
 * 'R-' + two random capital letters + a zero-padded 5-digit number (R-XX12345).
 */
export function newRequestId(existing: Set<string>): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (;;) {
    const id =
      "R-" +
      letters[Math.floor(Math.random() * 26)] +
      letters[Math.floor(Math.random() * 26)] +
      String(Math.floor(Math.random() * 100000)).padStart(5, "0");
    if (!existing.has(id)) return id;
  }
}

export function uuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}
