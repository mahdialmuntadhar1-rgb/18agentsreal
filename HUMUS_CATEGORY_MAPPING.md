# HUMUS Category Mapping Guide

This document outlines the transition from the old 9-category system to the new unified 15-category system.

## 📋 Unified Category Reference

| # | Category Name | Category ID | Icon |
|---|---------------|-------------|------|
| 1 | Dining & Cuisine | `dining_cuisine` | 🍽️ |
| 2 | Cafe & Coffee | `cafe_coffee` | ☕ |
| 3 | Shopping & Retail | `shopping_retail` | 🛍️ |
| 4 | Entertainment & Events | `entertainment_events` | 🎬 |
| 5 | Accommodation & Stays | `accommodation_stays` | 🏨 |
| 6 | Culture & Heritage | `culture_heritage` | 🏛️ |
| 7 | Business & Services | `business_services` | 💼 |
| 8 | Health & Wellness | `health_wellness` | ⚕️ |
| 9 | Doctors | `doctors` | 👨‍⚕️ |
| 10 | Hospitals | `hospitals` | 🏥 |
| 11 | Clinics | `clinics` | 🏥 |
| 12 | Transport & Mobility | `transport_mobility` | 🚗 |
| 13 | Public & Essential | `public_essential` | 🏛️ |
| 14 | Lawyers | `lawyers` | ⚖️ |
| 15 | Education | `education` | 🎓 |

---

## 🛠️ Scraper Update (src/lib/supabase.ts)

If you have a mapping function in your scraper, update it as follows:

```typescript
export function mapCategoryToHumus(originalCategory: string): string {
  const mapping: Record<string, string> = {
    'Restaurant': 'dining_cuisine',
    'Cafe': 'cafe_coffee',
    'Coffee Shop': 'cafe_coffee',
    'Mall': 'shopping_retail',
    'Store': 'shopping_retail',
    'Cinema': 'entertainment_events',
    'Hotel': 'accommodation_stays',
    'Museum': 'culture_heritage',
    'Office': 'business_services',
    'Gym': 'health_wellness',
    'Doctor': 'doctors',
    'Hospital': 'hospitals',
    'Medical Clinic': 'clinics',
    'Taxi': 'transport_mobility',
    'Government': 'public_essential',
    'Lawyer': 'lawyers',
    'School': 'education',
    'University': 'education',
  };

  return mapping[originalCategory] || 'business_services';
}
```

---

## 🗄️ SQL Migration (Supabase)

To migrate your existing data to the new category IDs, you can run the following SQL in your Supabase SQL Editor:

```sql
-- Update Food & Drink to Dining & Cuisine
UPDATE businesses SET category = 'dining_cuisine' WHERE category = 'food_drink';

-- Split Health into specific categories (Example)
UPDATE businesses SET category = 'hospitals' WHERE category = 'health' AND name ILIKE '%Hospital%';
UPDATE businesses SET category = 'doctors' WHERE category = 'health' AND name ILIKE '%Dr.%';
UPDATE businesses SET category = 'clinics' WHERE category = 'health' AND name ILIKE '%Clinic%';
UPDATE businesses SET category = 'health_wellness' WHERE category = 'health';

-- Update other categories
UPDATE businesses SET category = 'shopping_retail' WHERE category = 'shopping';
UPDATE businesses SET category = 'entertainment_events' WHERE category = 'entertainment';
UPDATE businesses SET category = 'accommodation_stays' WHERE category = 'hotels';
```
