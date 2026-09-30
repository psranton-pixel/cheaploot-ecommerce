import { ProductCondition, VehicleFitment } from './index';

export type ConfidenceTier = 'HIGH' | 'LIKELY' | 'PARTIAL' | 'LOW';

export type IdentificationStatus = 'EXACT MATCH' | 'HIGHLY LIKELY MATCH' | 'POSSIBLE MATCH' | 'UNKNOWN';

export type ReAnalysisFocusMode = 
  | 'ALL_IMAGES' 
  | 'FOCUS_LABELS' 
  | 'FOCUS_BARCODE' 
  | 'IDENTIFY_MODEL' 
  | 'IDENTIFY_AUTO';

export interface AustralianMarketValuation {
  lowValue: number;
  typicalValue: number;
  highValue: number;
  expectedSaleRange: string;
  recommendedEbayPrice: number;
  quickSalePrice: number;
  currency: 'AUD';
  valuationFactors: {
    conditionAdjustment: string;
    testingStatus: string;
    accessoriesImpact: string;
    packagingStatus: string;
    australianDemand: string;
  };
  marketResearchComps?: {
    exactMatches: string[];
    comparableProducts: string[];
    recentSoldRange: string;
    currentAskingRange: string;
  };
}

export interface CategorySpecificData {
  dvd?: {
    movieTitle: string;
    format: string; // DVD, Blu-Ray, 4K UHD
    region: string; // Region 4 Australia, All Region, Region B
    rating: string; // G, PG, M, MA15+, R18+
    edition?: string;
  };
  book?: {
    bookTitle: string;
    author: string;
    isbn: string;
    publisher?: string;
    editionOrYear?: string;
  };
  cd?: {
    artist: string;
    album: string;
    genre?: string;
    edition?: string;
  };
  powerTool?: {
    voltage: string; // 18V, 12V, 240V, 36V
    toolType: 'Drill' | 'Impact Driver' | 'Angle Grinder' | 'Circular Saw' | 'Jigsaw' | 'Reciprocating Saw' | 'Battery Charger' | 'Battery Pack' | 'Sander' | 'Blower' | 'Rotary Hammer' | 'Multitool' | 'Other';
    batteryPlatform?: string; // M18, LXT, Power X-Change, ONE+
    isBrushless?: boolean;
  };
  electrical?: {
    inputVoltage?: string; // 100-240V AC
    outputVoltage?: string; // 19.5V, 5V, 12V DC
    outputAmperage?: string; // 3.34A, 2.4A
    wattage?: string; // 65W, 100W
    connectorType?: string; // USB-C, Barrel 4.5mm, 7.4mm
  };
  automotive?: {
    oemNumber?: string;
    partNumber?: string;
    placement?: 'Front Left' | 'Front Right' | 'Rear Left' | 'Rear Right' | 'Centre' | 'Engine Bay' | 'Interior';
    suggestedFitment?: VehicleFitment[];
  };
  cable?: {
    cableType: 'HDMI' | 'USB-C' | 'Lightning' | 'DisplayPort' | 'Aux 3.5mm' | 'Ethernet RJ45' | 'Power Cable' | 'VGA';
    approximateLength: string; // e.g. ~2m, 1.5m, 0.5m
    standardVersion?: string; // 2.0, 2.1, 3.1
  };
}

export interface StructuredProductIdentification {
  item_type: string; // General physical product class (e.g. "Cordless drill", "DVD", "Power adapter")
  brand: string; // Identified brand or "Generic / Unknown"
  model: string; // Product model number (NOT serial number)
  manufacturer_part_number: string; // MPN
  barcode: string; // Barcode / EAN / UPC / GTIN
  oem_number?: string; // OEM automotive part number
  isbn?: string; // Book ISBN
  variant: string; // Distinct variant (e.g. "18V Brushless", "65W 4.5mm Tip")
  category: string; // Breadcrumb category (e.g. "Tools > Power Tools > Drills")
  department: string; // Top department
  identification_status: IdentificationStatus; // EXACT MATCH | HIGHLY LIKELY MATCH | POSSIBLE MATCH | UNKNOWN
  confirmed_attributes: Record<string, string>; // What is definitely confirmed
  not_confirmed_attributes: string[]; // What is still unconfirmed / missing
  confidence: number; // 0 - 100
  confidence_tier: ConfidenceTier;
  testing_status: string; // e.g. "Confirmed Bench Tested & Operational" | "Untested"
  evidence: string[]; // Step-by-step evidence lines (Priority: MPN -> Barcode -> Label -> Name -> Specs -> Physical)
  requested_photo_or_action: string; // Specific instruction if operator intervention is needed
  ocr_extracted_text: string[]; // Plausible text extracted from label areas at all angles
  defects_detected: string[]; // Scuffs, scratches, cracks, missing parts, wear
  valuation?: AustralianMarketValuation;
  category_specific?: CategorySpecificData;
  raw_hint_used?: string;
  focus_mode_used?: ReAnalysisFocusMode;
  formatted_response_text?: string;
}

export interface ProductIdentificationBenchmarkItem {
  id: string;
  canonicalName: string;
  category: string;
  description: string;
  sampleImages: string[];
  expectedItemType: string;
  expectedBrand: string;
  expectedModelOrIdentifier: string;
  expectedCategory: string;
  testNotes: string;
}

export interface BenchmarkTestResult {
  itemId: string;
  canonicalName: string;
  identification: StructuredProductIdentification;
  brandPass: boolean;
  itemTypePass: boolean;
  modelOrIdentifierPass: boolean;
  categoryPass: boolean;
  overallPass: boolean;
  executionTimeMs: number;
}
