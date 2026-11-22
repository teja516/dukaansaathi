import { createShop, updateShop, createShopCompleteSetup, createShopSampleData } from '@/lib/api';
import type { Shop } from '@/types/shop';

export interface OnboardingInput {
  shopName: string;
  ownerName?: string;
  openingCashBalancePaise: number;
  openingBankBalancePaise: number;
  interfaceLanguage: 'english' | 'hindi';
  loadSampleData: boolean;
}

/**
 * Welcome flow: create (or update) the shop, optionally load sample data, then mark setup complete.
 * Nothing is saved until the owner confirms the review screen.
 */
export async function finishOnboarding(existingShopId: string | null, input: OnboardingInput): Promise<Shop> {
  const fields = {
    shopName: input.shopName,
    ownerName: input.ownerName || null,
    openingCashBalancePaise: input.openingCashBalancePaise,
    openingBankBalancePaise: input.openingBankBalancePaise,
    interfaceLanguage: input.interfaceLanguage,
  };
  const shop = existingShopId ? await updateShop(existingShopId, fields) : await createShop(fields);
  if (input.loadSampleData) await createShopSampleData(shop.id, { confirmed: true });
  return createShopCompleteSetup(shop.id, { reviewConfirmed: true });
}
