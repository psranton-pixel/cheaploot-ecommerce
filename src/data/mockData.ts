import { Product, CategoryDepartment, Order, Review, ProductQuestion, AutomationRule, MarketplaceSyncLog, ProfitStats } from '../types';

export const INITIAL_DEPARTMENTS: CategoryDepartment[] = [
  {
    id: 'dept-auto',
    name: 'Automotive & Car Parts',
    slug: 'automotive',
    iconName: 'Car',
    featuredDeals: 'Up to 60% off Brake Kits & Alternators',
    popularBrands: ['Brembo', 'Bosch', 'Narva', 'Ryco', 'Bendix', 'GME', 'Kings'],
    promoImage: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80',
    subcategories: [
      { id: 'sub-auto-1', name: 'Car Parts & Engine', slug: 'car-parts', items: ['Alternators & Starters', 'Brake Pads & Rotors', 'Filters & Plugs', 'Batteries & Chargers', 'Belts & Pulleys'] },
      { id: 'sub-auto-2', name: '4WD & Touring', slug: '4wd-touring', items: ['LED Light Bars', 'Recovery Gear', 'Roof Racks', 'Snorkels', 'Air Compressors'] },
      { id: 'sub-auto-3', name: 'Tools & Diagnostics', slug: 'auto-diagnostics', items: ['OBD2 Scanners', 'Trolley Jacks & Stands', 'Oil Drainers', 'Battery Testers'] },
      { id: 'sub-auto-4', name: 'Car Care & Detailing', slug: 'car-care', items: ['Microfibre Towels', 'Polishing Compounds', 'Pressure Washers', 'Seat Covers'] }
    ]
  },
  {
    id: 'dept-tools',
    name: 'Tools & Power Tools',
    slug: 'tools',
    iconName: 'Wrench',
    featuredDeals: 'Heavy Duty Socket Sets from $19.95',
    popularBrands: ['Makita', 'Milwaukee', 'DeWalt', 'Bosch', 'Sidchrome', 'Kincrome', 'Stanley'],
    promoImage: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
    subcategories: [
      { id: 'sub-tools-1', name: 'Power Tools', slug: 'power-tools', items: ['Brushless Drills & Drivers', 'Angle Grinders', 'Circular & Mitre Saws', 'Rotary Hammers', 'Multi-Tools'] },
      { id: 'sub-tools-2', name: 'Hand Tools', slug: 'hand-tools', items: ['Socket & Spanner Sets', 'Torque Wrenches', 'Pliers & Cutters', 'Screwdrivers & Bits', 'Hammers & Axes'] },
      { id: 'sub-tools-3', name: 'Hardware & Fasteners', slug: 'hardware', items: ['Bolt & Nut Assortments', 'Ratchet Straps', 'Anchors & Screws', 'Heavy Duty Hinges'] },
      { id: 'sub-tools-4', name: 'Tool Storage & Workshop', slug: 'tool-storage', items: ['Tool Chests & Trolleys', 'Site Boxes', 'Cantilever Boxes', 'Workbench Vices'] }
    ]
  },
  {
    id: 'dept-electronics',
    name: 'Electronics & Computers',
    slug: 'electronics',
    iconName: 'Cpu',
    featuredDeals: 'GaN Fast Chargers & SSDs Under $49',
    popularBrands: ['Samsung', 'Anker', 'Sony', 'Kingston', 'Logitech', 'Baseus', 'UGREEN'],
    promoImage: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=600&auto=format&fit=crop&q=80',
    subcategories: [
      { id: 'sub-elec-1', name: 'Cables, Adapters & Power', slug: 'cables-adapters', items: ['USB-C GaN Fast Chargers', 'Braided HDMI 2.1 Cables', 'Power Banks 20000mAh', 'Multi-Port Docks', 'Travel Adapters'] },
      { id: 'sub-elec-2', name: 'Computer Accessories', slug: 'computers', items: ['Mechanical Keyboards', 'Wireless Ergonomic Mice', 'NVMe PCIe M.2 SSDs', 'USB 3.2 Flash Drives', 'Webcams 1080p'] },
      { id: 'sub-elec-3', name: 'Audio & Headphones', slug: 'audio', items: ['ANC Wireless Headphones', 'Bluetooth Party Speakers', 'Soundbars', 'Lavalier Mics'] },
      { id: 'sub-elec-4', name: 'Phones & Smart Devices', slug: 'phones-accessories', items: ['Magnetic Car Mounts', 'Tempered Glass Protectors', 'Wireless Charging Stands', 'Smart Watches'] }
    ]
  },
  {
    id: 'dept-home',
    name: 'Home Appliances & Living',
    slug: 'home-appliances',
    iconName: 'Home',
    featuredDeals: 'Air Fryers & Espresso Machines Warehouse Clearance',
    popularBrands: ['Breville', 'Sunbeam', 'DeLonghi', 'Ninja', 'Philips', 'Dyson', 'Ecovacs'],
    promoImage: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
    subcategories: [
      { id: 'sub-home-1', name: 'Kitchen Appliances', slug: 'kitchen', items: ['Digital Air Fryers', 'Espresso Machines', 'Nutri-Blenders', 'Toaster Ovens', 'Electric Kettles'] },
      { id: 'sub-home-2', name: 'Floorcare & Cleaning', slug: 'cleaning', items: ['Robot Vacuum Cleaners', 'Cordless Stick Vacs', 'Steam Mops', 'Carpet Washers'] },
      { id: 'sub-home-3', name: 'Climate & Air', slug: 'climate', items: ['HEPA Air Purifiers', 'Dehumidifiers', 'Ceramic Tower Heaters', 'Misting Fans'] },
      { id: 'sub-home-4', name: 'Home Living & Storage', slug: 'home-storage', items: ['Heavy Duty Shelving', 'Storage Totes', 'Security Safes', 'LED Floodlights'] }
    ]
  },
  {
    id: 'dept-clearance',
    name: 'Clearance & Used Loot',
    slug: 'clearance',
    iconName: 'Flame',
    featuredDeals: 'Daily Liquidation Smash Deals Up to 85% off RRP',
    popularBrands: ['Assorted Liquidation Brands', 'Ex-Display Models', 'Factory Seconds', 'Refurbished Grade A'],
    promoImage: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&auto=format&fit=crop&q=80',
    subcategories: [
      { id: 'sub-clr-1', name: 'Open Box Bargains', slug: 'open-box', items: ['Tested & Certified Open Box', 'Customer Returns 100% Functional', 'Damaged Packaging Specials'] },
      { id: 'sub-clr-2', name: 'Refurbished Tech & Tools', slug: 'refurbished', items: ['Factory Refurbished Power Tools', 'Inspected Diagnostic Tools', 'Grade A iPads & Laptops'] },
      { id: 'sub-clr-3', name: 'Pallet Overstock Liquidation', slug: 'bulk-clearance', items: ['Workshop Mixed Lots', 'Tradie Consumable Bulk Packs', 'End-of-Line Clearance'] },
      { id: 'sub-clr-4', name: 'Under $20 Bargain Bin', slug: 'under-20', items: ['Fast Charging Cables', 'Microfibre Packs', 'OBD2 Dongles', 'Work Gloves & Glasses'] }
    ]
  }
];

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_PROFIT_STATS: ProfitStats = {
  todayRevenue: 0,
  todayOrders: 0,
  todayProfit: 0,
  todayAOV: 0,
  todayUnitsSold: 0,
  todayVisitors: 0,
  todayConversionRate: 0,
  totalStockValueCost: 0,
  totalStockValueRetail: 0,
  estimatedGrossProfit: 0,
  totalSkus: 0,
  activeListings: 0,
  outOfStockCount: 0,
  lowStockCount: 0,
  deadStockCount: 0,
  slowMovingCount: 0
};

export const INITIAL_RULES: AutomationRule[] = [];

export const INITIAL_MARKETPLACE_LOGS: MarketplaceSyncLog[] = [];

export const INITIAL_REVIEWS: Review[] = [];

export const INITIAL_QUESTIONS: ProductQuestion[] = [];
