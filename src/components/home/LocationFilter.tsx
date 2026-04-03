import React from 'react';
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
  const { selectedGovernorate, setGovernorate } = useHomeStore();

  const handleGovernorateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setGovernorate(e.target.value);
  };

  return (
    <div className="bg-transparent mb-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-end">
          {/* Governorate Dropdown */}
          <div className="w-full md:w-1/2">
            <p className="text-sm font-bold text-[#8B1A1A] mb-3 poppins-semibold">
              Please first choose your governorate.
            </p>
            <div className="relative group">
              <select
                value={selectedGovernorate}
                onChange={handleGovernorateChange}
                className="w-full appearance-none bg-white border-2 border-[#f5dada] focus:border-[#8B1A1A] rounded-2xl px-6 py-4 text-[#2B2F33] font-bold text-lg shadow-sm focus:outline-none transition-all cursor-pointer"
              >
                {GOVERNORATES.map((gov) => (
                  <option key={gov.name} value={gov.name}>
                    {gov.name} - {gov.nameAr}
                  </option>
                ))}
              </select>
              <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-[#8B1A1A]">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
            <p className="text-xs font-bold text-[#8B1A1A]/60 mt-3 uppercase tracking-widest">
              And beneath that, the governorates.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
