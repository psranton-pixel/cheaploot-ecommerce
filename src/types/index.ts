export * from './identification';
export * from './calendar';
export * from './sheets';
import { StructuredProductIdentification } from './identification';

export type ProductCondition = 
  | 'Brand New' 
  | 'New Other' 
  | 'Open Box' 
  | 'Refurbished' 
  | 'Excellent Used' 
  | 'Good Used' 
  | 'Fair Used' 
  | 'For Parts / Not Working';

export interface VehicleFitment {
  yearFrom: number;
  yearTo: number;
  make: string;
  model: string;
  series?: string;
  engine?: string;
  transmission?: string;
  notes?: string;
}

export interface UserVehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  series?: string;
  engine?: string;
}

export interface Product {
  id: string;
  title: string;
  brand: string;
  sku: string;
  barcode: string;
  upc?: string;
  mpn: string;
  oemNumber?: string;
  price: number;
  wasPrice?: number;
  costPrice: number;
  condition: ProductCondition;
  conditionDescription?: string;
  department: string;
  category: string;
  subCategory?: string;
  subSubCategory?: string;
  images: string[];
  videoUrl?: string;
  stock: number;
  isOneOff?: boolean; // Unique inventory item (qty=1)
  warehouseLocation: string; // e.g. W1-A-03-R2-S4-B7
  weightKg: number;
  dimensionsCm: { length: number; width: number; height: number };
  shippingClass: 'standard' | 'express' | 'bulky' | 'free';
  rating: number;
  reviewCount: number;
  isClearance?: boolean;
  isSale?: boolean;
  isTrending?: boolean;
  isHotDeal?: boolean;
  isLootOfTheDay?: boolean;
  isNewArrival?: boolean;
  isUsedOrRefurb?: boolean;
  dateListed: string;
  viewsCount: number;
  salesCount: number;
  fitment?: VehicleFitment[];
  specs: Record<string, string>;
  features: string[];
  whatsIncluded: string[];
  description: string;
  warranty: string;
  returnsPolicy: string;
  ebayItemId?: string;
  marketplaceSynced?: boolean;
  allowPickup: boolean;
  pickupLocations: string[];
  tags: string[];
}

export interface CategoryDepartment {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  featuredDeals?: string;
  popularBrands?: string[];
  promoImage?: string;
  subcategories: {
    id: string;
    name: string;
    slug: string;
    items: string[];
  }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedPickupLocation?: string;
}

export type OrderStatus = 
  | 'new'
  | 'paid'
  | 'awaiting_payment'
  | 'ready_to_pick'
  | 'picking'
  | 'packed'
  | 'ready_for_pickup'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export interface OrderItem {
  productId: string;
  sku: string;
  title: string;
  image: string;
  condition: ProductCondition;
  price: number;
  quantity: number;
  warehouseLocation: string;
  picked?: boolean;
  pickedBarcode?: string;
}

export interface OrderActivity {
  id: string;
  timestamp: string;
  status: OrderStatus;
  note: string;
  author: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    address: {
      street: string;
      suburb: string;
      state: 'NSW' | 'VIC' | 'QLD' | 'WA' | 'SA' | 'TAS' | 'ACT' | 'NT';
      postcode: string;
      country: string;
    };
  };
  items: OrderItem[];
  status: OrderStatus;
  shippingMethod: 'standard' | 'express' | 'pickup' | 'bulky';
  pickupLocation?: string;
  shippingCost: number;
  subtotal: number;
  gstAmount: number;
  discountAmount: number;
  promoCode?: string;
  total: number;
  paymentMethod: 'credit_card' | 'paypal' | 'afterpay' | 'zip' | 'apple_pay' | 'google_pay';
  trackingNumber?: string;
  courier?: 'Australia Post' | 'Sendle' | 'Aramex' | 'CouriersPlease' | 'StarTrack';
  shippingLabelUrl?: string;
  timeline: OrderActivity[];
  createdAt: string;
  updatedAt: string;
}

export interface SellQuoteSubmission {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  description: string;
  photos: string[];
  quantity: number;
  location: string;
  askingPrice: number;
  status: 'pending' | 'reviewed' | 'offer_made' | 'rejected' | 'accepted';
  offerAmount?: number;
  createdAt: string;
}

export interface StocktakeDiscrepancy {
  id: string;
  productId: string;
  sku: string;
  title: string;
  location: string;
  systemQty: number;
  scannedQty: number;
  discrepancy: number;
  flaggedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export interface MarketplaceSyncLog {
  id: string;
  channel: 'eBay AU' | 'Google Merchant' | 'Meta Catalogue' | 'Shopify';
  type: 'stock_sync' | 'price_sync' | 'listing_created' | 'order_imported' | 'error';
  message: string;
  sku?: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  condition: string;
  action: string;
  enabled: boolean;
  lastRun?: string;
  executionCount: number;
}

export interface Review {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  date: string;
  photos?: string[];
  helpfulCount: number;
}

export interface ProductQuestion {
  id: string;
  productId: string;
  author: string;
  question: string;
  date: string;
  answer?: string;
  answeredBy?: string;
  answeredDate?: string;
  isPublic: boolean;
}

export interface ProfitStats {
  todayRevenue: number;
  todayOrders: number;
  todayProfit: number;
  todayAOV: number;
  todayUnitsSold: number;
  todayVisitors: number;
  todayConversionRate: number;
  totalStockValueCost: number;
  totalStockValueRetail: number;
  estimatedGrossProfit: number;
  totalSkus: number;
  activeListings: number;
  outOfStockCount: number;
  lowStockCount: number;
  deadStockCount: number;
  slowMovingCount: number;
}

// ==========================================
// AI PRODUCT IMPORT & LISTING ENGINE TYPES
// ==========================================

export type ImportSourceType = 
  | 'csv' 
  | 'xlsx' 
  | 'photos' 
  | 'barcode' 
  | 'ebay' 
  | 'bulk_entry' 
  | 'manual'
  | 'quick_list';

export type ImportMode = 'CREATE_ONLY' | 'UPDATE_ONLY' | 'CREATE_AND_UPDATE';

export type ImportDraftStatus = 
  | 'imported' 
  | 'processing' 
  | 'draft' 
  | 'needs_review' 
  | 'ready_to_publish' 
  | 'published' 
  | 'error' 
  | 'archived';

export interface ImportJob {
  id: string;
  source: string;
  sourceType: ImportSourceType;
  createdAt: string;
  updatedAt: string;
  totalDetected: number;
  createdCount: number;
  updatedCount: number;
  errorsCount: number;
  duplicatesCount: number;
  pendingReviewCount: number;
  publishedCount: number;
  status: 'queued' | 'processing' | 'completed' | 'completed_with_errors' | 'failed' | 'rolled_back';
  templateId?: string;
  importMode: ImportMode;
  batchId: string;
  canRollback: boolean;
  notes?: string;
}

export interface ImportTemplate {
  id: string;
  name: string;
  sourceFormat: 'csv' | 'xlsx' | 'ebay' | 'custom';
  description?: string;
  mappings: Record<string, string>; // rawHeader -> targetField
  defaultCondition?: ProductCondition;
  defaultWarehouseLocation?: string;
  defaultDepartment?: string;
  defaultCategory?: string;
  allowBlankOverwrite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DuplicateMatchInfo {
  existingProductId: string;
  existingSku: string;
  existingTitle: string;
  existingPrice: number;
  existingStock: number;
  existingImage?: string;
  matchReason: 'exact_sku' | 'barcode' | 'mpn' | 'fuzzy_title' | 'brand_model' | 'image_similarity';
  similarity: number;
}

export interface ImportDraftProduct {
  id: string;
  importJobId?: string;
  batchId?: string;
  rawRowData?: Record<string, any>;
  title: string;
  shortDescription?: string;
  description: string;
  brand: string;
  sku: string;
  barcode: string;
  upc?: string;
  mpn: string;
  oemNumber?: string;
  condition: ProductCondition;
  conditionDescription: string;
  department: string;
  category: string;
  subCategory?: string;
  subSubCategory?: string;
  price: number;
  wasPrice?: number;
  costPrice: number;
  freightCost?: number;
  repairCost?: number;
  otherAcquisitionCost?: number;
  landedCost: number;
  suggestedPrice?: number;
  priceReasoning?: string;
  stock: number;
  isOneOff: boolean;
  warehouseLocation: string; // e.g. W1-A-03-R2-S4-B7
  weightKg: number;
  dimensionsCm: { length: number; width: number; height: number };
  shippingClass: 'standard' | 'express' | 'bulky' | 'free';
  images: string[];
  features: string[];
  specs: Record<string, string>;
  whatsIncluded: string[];
  searchKeywords: string[];
  seoTitle?: string;
  metaDescription?: string;
  tags: string[];
  ebayTitle?: string;
  ebayCategory?: string;
  ebayItemSpecifics?: Record<string, string>;
  vehicleFitment?: VehicleFitment[];
  identificationStatus?: 'EXACT MATCH' | 'HIGHLY LIKELY MATCH' | 'POSSIBLE MATCH' | 'UNKNOWN';
  testingStatus?: string;
  lowValue?: number;
  typicalValue?: number;
  highValue?: number;
  expectedSaleRange?: string;
  recommendedEbayPrice?: number;
  quickSalePrice?: number;
  marketResearchComps?: {
    exactMatches: string[];
    comparableProducts: string[];
    recentSoldRange: string;
    currentAskingRange: string;
  };
  researchEvidence?: string[];
  warnings?: string[];
  formattedListingText?: string;
  status: ImportDraftStatus;
  confidence: {
    overall: number; // 0 - 100
    title: number;
    brand: number;
    model: number;
    category: number;
    condition: number;
    price: number;
    ocr?: number;
    requiresManualConfirmation?: boolean;
  };
  defectsDetected?: string[];
  ocrExtractedText?: string[];
  possibleDuplicates?: DuplicateMatchInfo[];
  duplicateResolution?: 'use_existing' | 'update_existing' | 'create_separate' | 'skip';
  validationErrors: string[];
  validationWarnings: string[];
  qualityCompletenessScore: number; // 0 - 100
  aiReasoningNotes?: string;
  structuredIdentification?: StructuredProductIdentification;
  selected?: boolean;
  isPublished?: boolean;
}

export interface PhotoGroup {
  id: string;
  images: string[];
  primaryImageIndex: number;
  status: 'pending' | 'processing' | 'identified' | 'error';
  ocrSnippet?: string;
  structuredIdentification?: StructuredProductIdentification;
  draftProduct?: ImportDraftProduct;
}

export interface ImportMetricsSummary {
  todayImported: number;
  todayDraftsGenerated: number;
  todayPublished: number;
  todayDuplicatesPrevented: number;
  todayErrors: number;
  avgProcessingTimeSec: number;
  queuePendingImages: number;
  queueAiProcessing: number;
  queueNeedsReview: number;
  queueReadyToPublish: number;
}
