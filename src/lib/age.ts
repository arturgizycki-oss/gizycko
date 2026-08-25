/**
 * Birth dates arrive from an <input type="date"> and are stored as a date-only
 * value at UTC midnight. Reading them with local getters shifts the day
 * backwards on any server west of UTC, which would let someone through the 18+
 * gate a day early - so every comparison here is done in UTC.
 */
export function ageFrom(birthDate: Date, now = new Date()): number {
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();

  const monthDiff = now.getUTCMonth() - birthDate.getUTCMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getUTCDate() < birthDate.getUTCDate())
  ) {
    age -= 1;
  }

  return age;
}

export const MIN_AGE = 18;

export function isAdult(birthDate: Date, now = new Date()): boolean {
  return ageFrom(birthDate, now) >= MIN_AGE;
}
