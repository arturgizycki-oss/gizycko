/** Whole years between a birth date and now. */
export function ageFrom(birthDate: Date, now = new Date()): number {
  let age = now.getFullYear() - birthDate.getFullYear();
  const monthDiff = now.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

export const MIN_AGE = 18;

export function isAdult(birthDate: Date, now = new Date()): boolean {
  return ageFrom(birthDate, now) >= MIN_AGE;
}
