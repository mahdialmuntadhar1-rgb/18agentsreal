import type { BaseGovernor } from '../governors/base-governor.ts';
import {
  RestaurantsGovernor,
  CafesGovernor,
  HotelsGovernor,
  ShoppingGovernor,
  BanksGovernor,
  EducationGovernor,
  EntertainmentGovernor,
  TourismGovernor,
  DoctorsGovernor,
  LawyersGovernor,
  HospitalsGovernor,
  MedicalClinicsGovernor,
  RealEstateGovernor,
  EventsGovernor,
  OthersGovernor,
  PharmaciesGovernor,
  GymsGovernor,
  BakeriesGovernor,
  BeautySalonsGovernor,
  SupermarketsGovernor,
  FurnitureGovernor,
} from '../governors/index.ts';

type GovernorCtor = new (agentName?: string, city?: string, governmentRate?: string) => BaseGovernor;

const registry: Record<string, GovernorCtor> = {
  restaurants: RestaurantsGovernor,
  cafes: CafesGovernor,
  hotels: HotelsGovernor,
  shopping: ShoppingGovernor,
  banks: BanksGovernor,
  education: EducationGovernor,
  entertainment: EntertainmentGovernor,
  tourism: TourismGovernor,
  doctors: DoctorsGovernor,
  lawyers: LawyersGovernor,
  hospitals: HospitalsGovernor,
  'medical-clinics': MedicalClinicsGovernor,
  'real-estate': RealEstateGovernor,
  events: EventsGovernor,
  others: OthersGovernor,
  pharmacies: PharmaciesGovernor,
  gyms: GymsGovernor,
  bakeries: BakeriesGovernor,
  'beauty-salons': BeautySalonsGovernor,
  supermarkets: SupermarketsGovernor,
  furniture: FurnitureGovernor,
};

export const resolveGovernor = (category: string, agentName: string, city: string): BaseGovernor => {
  const Ctor = registry[category.toLowerCase()];
  if (!Ctor) {
    throw new Error(`No governor registered for category: ${category}`);
  }

  return new Ctor(agentName, city);
};
