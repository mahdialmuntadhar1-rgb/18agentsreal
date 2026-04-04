export type { BusinessData } from '../sources/base-adapter.ts';

export abstract class BaseGovernor {
  abstract category: string;
  abstract agentName: string;
  abstract governmentRate: string;
  abstract city: string;

  abstract gather(city?: string, category?: string): Promise<import('../sources/base-adapter.ts').BusinessData[]>;

  async run(city?: string, category?: string): Promise<import('../sources/base-adapter.ts').BusinessData[]> {
    return this.gather(city, category);
  }
}
