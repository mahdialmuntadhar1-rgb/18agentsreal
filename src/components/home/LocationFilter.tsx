import React from 'react';
import { motion } from 'motion/react';
import { useHomeStore } from "@/stores/homeStore";

const GOVERNORATES = [
  { name: "Baghdad", nameAr: "بغداد" },
  { name: "Erbil", nameAr: "أربيل" },
  { name: "Basra", nameAr: "البصرة" },
  { name: "Mosul", nameAr: "الموصل" },
  { name: "Sulaymaniyah", nameAr: "السليمانية" },
  { name: "Duhok", nameAr: "دهوك" },
  { name: "Kirkuk", nameAr: "كركوك" },
  { name: "Najaf", nameAr: "النجف" },
  { name: "Karbala", nameAr: "كربلاء" },
  { name: "Nasiriyah", nameAr: "الناصرية" },
  { name: "Amarah", nameAr: "العمارة" },
  { name: "Hilla", nameAr: "الحلة" },
  { name: "Kut", nameAr: "الكوت" },
  { name: "Diwaniyah", nameAr: "الديوانية" },
  { name: "Ramadi", nameAr: "الرمادي" },
  { name: "Baqubah", nameAr: "بعقوبة" },
  { name: "Samawah", nameAr: "السماوة" },
  { name: "Tikrit", nameAr: "تكريت" },
];

const CITIES_BY_GOVERNORATE: Record<string, string[]> = {
  Baghdad: ["Central", "Kadhimiya", "Adhamiyah", "Mansour", "Karada", "Sadr City"],
  Erbil: ["Erbil Center", "Ankawa", "Shaqlawa", "Soran"],
  Basra: ["Basra City", "Zubair", "Qurna", "Fao"],
  Mosul: ["Mosul Center", "Hamdaniya", "Tel Kaif"],
  Sulaymaniyah: ["Suli Center", "Halabja", "Ranya", "Chamchamal"],
  Duhok: ["Duhok Center", "Zakho", "Amedi"],
  Kirkuk: ["Kirkuk Center", "Hawija", "Daquq"],
  Najaf: ["Najaf Center", "Kufa", "Manathera"],
  Karbala: ["Karbala Center", "Hindiya", "Ain al-Tamur"],
  Nasiriyah: ["Nasiriyah Center", "Shatra", "Rifa'i"],
  Amarah: ["Amarah Center", "Maimouna", "Qalat Saleh"],
  Hilla: ["Hilla Center", "Mahawil", "Musayib"],
  Kut: ["Kut Center", "Suwaira", "Aziziya"],
  Diwaniyah: ["Diwaniyah Center", "Afak", "Shamiya"],
  Ramadi: ["Ramadi Center", "Fallujah", "Hit", "Haditha"],
  Baqubah: ["Baqubah Center", "Muqdadiya", "Khanaqin"],
  Samawah: ["Samawah Center", "Rumaitha", "Khidhir"],
  Tikrit: ["Tikrit Center", "Samarra", "Balad", "Dujail"],
};

export default function LocationFilter() {
  const { selectedGovernorate, setGovernorate, selectedCity, setCity } = useHomeStore();

  const cities = CITIES_BY_GOVERNORATE[selectedGovernorate] || [];

  return (
    <div className="space-y-4 mb-6">
      {/* Governorate Filter (Horizontal Scroll) */}
      <div className="w-full overflow-hidden">
        <div className="flex gap-2 overflow-x-auto px-4 no-scrollbar pb-2">
          {GOVERNORATES.map((gov) => (
            <button
              key={gov.name}
              onClick={() => setGovernorate(gov.name)}
              className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all border-2 ${
                selectedGovernorate === gov.name
                  ? "bg-[#2CA6A4] text-white border-[#2CA6A4] shadow-md"
                  : "bg-white text-[#2B2F33] border-[#E5E7EB] hover:border-[#2CA6A4]/30"
              }`}
            >
              {gov.name}
            </button>
          ))}
        </div>
      </div>

      {/* City Filter (Chips) */}
      <div className="w-full overflow-hidden">
        <div className="flex gap-2 overflow-x-auto px-4 no-scrollbar pb-2">
          <button
            onClick={() => setCity(null)}
            className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              selectedCity === null
                ? "bg-[#E87A41] text-white border-[#E87A41]"
                : "bg-white text-[#6B7280] border-[#E5E7EB]"
            }`}
          >
            All Cities
          </button>
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setCity(city)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                selectedCity === city
                  ? "bg-[#E87A41] text-white border-[#E87A41]"
                  : "bg-white text-[#6B7280] border-[#E5E7EB]"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
