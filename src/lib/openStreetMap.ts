export async function fetchBusinessesFromOSM(city: string): Promise<any[]> {
  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  
  const query = `
    [out:json];
    area["name"="${city}"]->.searchArea;
    (
      node["shop"](area.searchArea);
      node["amenity"](area.searchArea);
      way["shop"](area.searchArea);
      way["amenity"](area.searchArea);
    );
    out body;
  `;

  const response = await fetch(overpassUrl, {
    method: 'POST',
    body: `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!response.ok) throw new Error(`OSM API error: ${response.status}`);

  const data = await response.json();
  
  return (data.elements || []).map((el: any) => ({
    name_en: el.tags?.name || null,
    name_ar: el.tags?.['name:ar'] || null,
    address_en: [el.tags?.['addr:street'], el.tags?.['addr:housenumber']].filter(Boolean).join(' ') || null,
    category: el.tags?.shop || el.tags?.amenity || 'unknown',
    latitude: el.lat ?? null,
    longitude: el.lon ?? null,
  }));
}
