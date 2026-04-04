export const dashboardService = {
  cleanScrapedData: (rawStats: any[]) => rawStats.map(item => ({
    id: item.id,
    businessName: item.name || 'Unknown',
    province: item.location?.province || 'Unassigned',
    verified: !!item.is_verified,
    lastUpdated: new Date().toISOString()
  })),
  getProvinceMetrics: (data: any[]) => {
    const provinces = ["Baghdad", "Basra", "Nineveh", "Erbil", "Najaf", "Karbala", "Sulaymaniyah", "Kirkuk", "Anbar", "Diyala", "Muthanna", "Qadisiyah", "Maysan", "Wasit", "Duhok", "Babil", "Dhi Qar", "Salah al-Din"];
    return provinces.map(p => ({
      name: p,
      count: data.filter(d => d.province === p).length
    }));
  }
};
