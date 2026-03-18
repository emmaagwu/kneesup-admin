import type { PageServerLoad } from './$types';
import { getRevenueRecords, getPlatformStats } from '$lib/server/db';

export const load: PageServerLoad = async () => {
  const [records, stats] = await Promise.all([
    getRevenueRecords(),
    getPlatformStats()
  ]);

  const totalRevenue = records.reduce((sum, r) => sum + r.amount, 0);
  const totalFees    = records.reduce((sum, r) => sum + r.fee, 0);
  const totalNet     = records.reduce((sum, r) => sum + r.net, 0);
  const avgPerBooking = records.length > 0 ? Math.round(totalRevenue / records.length) : 0;

  return {
    records,
    revenueStats: {
      totalRevenue,
      totalFees,
      totalNet,
      avgPerBooking
    }
  };
};
