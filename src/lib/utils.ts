import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type BusinessNameField =
  | string
  | {
      ku?: string;
      ar?: string;
      en?: string;
    }
  | null
  | undefined;

export const getBusinessName = (nameField: BusinessNameField): string => {
  if (!nameField) return "No Name";
  if (typeof nameField === "string") return nameField;
  return nameField.ku || nameField.ar || nameField.en || "No Name";
};
