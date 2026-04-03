export interface Business {
  id: string;
  name: string;
  nameAr?: string;
  nameKu?: string;
  category: string;
  governorate: string;
  city: string;
  address: string;
  phone: string;
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  image?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
}
