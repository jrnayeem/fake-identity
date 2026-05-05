import { countries, CountryData } from "@/data/names";

export { countries };
export type { CountryData };

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickSeed<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

export interface GeneratedIdentity {
  country: CountryData;
  gender: "male" | "female";
  firstName: string;
  lastName: string;
  fullName: string;
  username: string;
  email: string;
  password: string;
  dateOfBirth: string;
  age: number;
}

function generateUsername(firstName: string, lastName: string): string {
  const fn = firstName.toLowerCase().replace(/[^a-z]/g, "");
  const ln = lastName.toLowerCase().replace(/[^a-z]/g, "");
  const year = Math.floor(Math.random() * 35) + 1970;
  const patterns = [
    () => `${fn}.${ln}`,
    () => `${fn}${ln}`,
    () => `${fn[0]}${ln}`,
    () => `${fn}${ln.slice(0, 3)}`,
    () => `${fn}.${ln}${year.toString().slice(-2)}`,
    () => `${fn}${Math.floor(Math.random() * 999) + 1}`,
    () => `${fn[0]}${fn.slice(-1)}${ln}`,
    () => `${fn}_${ln}`,
    () => `${fn}${ln}${Math.floor(Math.random() * 99) + 1}`,
    () => `${ln}.${fn}`,
    () => `${ln}${fn[0]}`,
    () => `${fn.slice(0, 4)}${ln.slice(0, 4)}`,
  ];
  const result = pick(patterns)();
  return result.length > 20 ? result.slice(0, 20) : result;
}

function generateEmail(firstName: string, lastName: string, domain: string): string {
  const fn = firstName.toLowerCase().replace(/[^a-z]/g, "");
  const ln = lastName.toLowerCase().replace(/[^a-z]/g, "");
  const patterns = [
    () => `${fn}.${ln}@${domain}`,
    () => `${fn}${ln}@${domain}`,
    () => `${fn[0]}${ln}@${domain}`,
    () => `${fn}.${ln[0]}@${domain}`,
    () => `${fn}@${domain}`,
    () => `${fn}.${ln}${Math.floor(Math.random() * 99) + 1}@${domain}`,
    () => `${fn[0]}.${ln}@${domain}`,
    () => `${fn}_${ln}@${domain}`,
    () => `${fn}${Math.floor(Math.random() * 999) + 1}@${domain}`,
    () => `${ln}.${fn}@${domain}`,
  ];
  return pick(patterns)();
}

function generatePassword(
  firstName: string,
  lastName: string,
  birthYear: number
): string {
  const fn = firstName.toLowerCase().replace(/[^a-z]/g, "");
  const ln = lastName.toLowerCase().replace(/[^a-z]/g, "");

  const specials = ["!", "@", "#", "$"];
  const separators = ["", ".", "_"];

  const shortYear = birthYear.toString().slice(-2);
  const fullYear = birthYear.toString();

  const patterns = [
    () => `${fn}${ln}${shortYear}`,
    () => `${fn}.${ln}${shortYear}`,
    () => `${fn}_${ln}${shortYear}`,
    () => `${fn}${ln}${Math.floor(Math.random() * 99) + 1}`,
    () => `${fn[0]}${ln}${shortYear}`,
    () => `${fn}${ln}${fullYear}`,
    () => `${ln}${fn}${shortYear}`,
    () => `${fn}${separators[Math.floor(Math.random() * separators.length)]}${ln}${specials[Math.floor(Math.random() * specials.length)]}`,
    () => `${fn}${shortYear}${specials[Math.floor(Math.random() * specials.length)]}`,
    () => `${fn}${ln}${shortYear}${specials[Math.floor(Math.random() * specials.length)]}`,
  ];

  let password = pick(patterns)();

  // Ensure minimum length (8–12)
  if (password.length < 8) {
    password += Math.floor(Math.random() * 999);
  }

  return password.slice(0, 12);
}

function generateDateOfBirth(): { dob: string; age: number } {
  const now = new Date();
  const minAge = 18;
  const maxAge = 80;
  const age = Math.floor(Math.random() * (maxAge - minAge + 1)) + minAge;
  const birthYear = now.getFullYear() - age;
  const birthMonth = Math.floor(Math.random() * 12) + 1;
  const daysInMonth = new Date(birthYear, birthMonth, 0).getDate();
  const birthDay = Math.floor(Math.random() * daysInMonth) + 1;
  const dob = `${birthYear}-${String(birthMonth).padStart(2, "0")}-${String(birthDay).padStart(2, "0")}`;
  return { dob, age };
}

export function generateIdentity(
  countryCode?: string,
  gender?: "male" | "female"
): GeneratedIdentity {
  const country = countryCode
    ? countries.find((c) => c.code === countryCode) ?? pick(countries)
    : pick(countries);

  const resolvedGender: "male" | "female" = gender ?? (Math.random() > 0.5 ? "male" : "female");

  const firstName =
    resolvedGender === "male" ? pick(country.maleNames) : pick(country.femaleNames);
  const lastName = pick(country.lastNames);
  const fullName = `${firstName} ${lastName}`;
  const username = generateUsername(firstName, lastName);
  const domain = pick(country.emailDomains);
  const email = generateEmail(firstName, lastName, domain);
  const { dob, age } = generateDateOfBirth();
  const birthYear = parseInt(dob.split("-")[0]);
  const password = generatePassword(firstName, lastName, birthYear);

  return {
    country,
    gender: resolvedGender,
    firstName,
    lastName,
    fullName,
    username,
    email,
    password,
    dateOfBirth: dob,
    age,
  };
}

export function generateBulk(
  count: number,
  countryCode?: string,
  gender?: "male" | "female"
): GeneratedIdentity[] {
  return Array.from({ length: count }, () => generateIdentity(countryCode, gender));
}
