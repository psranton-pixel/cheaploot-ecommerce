import { getSupabaseAdmin } from '../db';

export interface AuditLogEntry {
  id?: string;
  userId?: string;
  userEmail?: string;
  eventType: 'PRICE_CHANGE' | 'STOCK_ADJUSTMENT' | 'PRODUCT_DELETE' | 'ORDER_STATUS' | 'REFUND_ISSUED' | 'ROLE_CHANGE' | 'PRODUCT_CREATE' | 'PRODUCT_UPDATE' | 'PRODUCT_MERGE' | 'IMPORT_ROLLBACK';
  entity: 'product' | 'inventory' | 'order' | 'refund' | 'user' | 'import_batch';
  entityId: string;
  previousValue?: any;
  newValue?: any;
  ipAddress?: string;
  createdAt?: string;
}

export async function writeAuditLog(entry: AuditLogEntry) {
  const supabase = getSupabaseAdmin();
  const logData = {
    user_id: entry.userId || null,
    user_email: entry.userEmail || 'admin@cheaploot.com.au',
    event_type: entry.eventType,
    entity: entry.entity,
    entity_id: entry.entityId,
    previous_value: entry.previousValue ? JSON.stringify(entry.previousValue) : null,
    new_value: entry.newValue ? JSON.stringify(entry.newValue) : null,
    ip_address: entry.ipAddress || '127.0.0.1',
    created_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      await supabase.from('audit_logs').insert(logData);
    } catch (err) {
      console.warn('Could not write audit log to Supabase:', err);
    }
  }

  return logData;
}

export function calculateRealFinancialMetrics(products: any[], orders: any[]) {
  // Aggregate real financial numbers (NEVER fabricated)
  const totalStockValueCost = products.reduce((acc, p) => acc + (Number(p.costPrice || 0) * Number(p.stock || 0)), 0);
  const totalStockValueRetail = products.reduce((acc, p) => acc + (Number(p.price || 0) * Number(p.stock || 0)), 0);
  const estimatedGrossProfit = Math.max(0, totalStockValueRetail - totalStockValueCost);

  let todayRevenue = 0;
  let todayCostOfGoods = 0;
  let todayPaymentFees = 0;
  let todayShippingCosts = 0;
  let todayUnitsSold = 0;

  for (const o of orders) {
    todayRevenue += Number(o.total || 0);
    todayPaymentFees += Number(o.financials?.paymentFee || 0);
    todayShippingCosts += Number(o.financials?.shippingCost || 0);
    if (Array.isArray(o.items)) {
      for (const item of o.items) {
        todayUnitsSold += Number(item.quantity || 1);
        todayCostOfGoods += (Number(item.costPrice || 0) * Number(item.quantity || 1));
      }
    }
  }

  const todayNetProfit = Math.max(0, todayRevenue - todayCostOfGoods - todayPaymentFees - todayShippingCosts);
  const todayAOV = orders.length > 0 ? (todayRevenue / orders.length) : 0;

  return {
    todayRevenue: Number(todayRevenue.toFixed(2)),
    todayOrders: orders.length,
    todayProfit: Number(todayNetProfit.toFixed(2)),
    todayAOV: Number(todayAOV.toFixed(2)),
    todayUnitsSold,
    totalStockValueCost: Number(totalStockValueCost.toFixed(2)),
    totalStockValueRetail: Number(totalStockValueRetail.toFixed(2)),
    estimatedGrossProfit: Number(estimatedGrossProfit.toFixed(2)),
    totalSkus: products.length,
    activeListings: products.filter(p => p.stock > 0).length,
    outOfStockCount: products.filter(p => p.stock === 0).length,
    lowStockCount: products.filter(p => p.stock > 0 && p.stock < 5).length,
    deadStockCount: 0,
    slowMovingCount: 0
  };
}
