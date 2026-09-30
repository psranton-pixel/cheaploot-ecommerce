import React, { useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { Header } from './components/Header/Header';
import { HeroBanner } from './components/Home/HeroBanner';
import { HotDealsPills } from './components/Home/HotDealsPills';
import { TrendingPromoGrid } from './components/Home/TrendingPromoGrid';
import { ProductShelf } from './components/Home/ProductShelf';
import { LootOfTheDay } from './components/Home/LootOfTheDay';
import { VehicleFitmentStrip, SellYourStuffStrip, BuyingGuidesStrip, TrustStrip } from './components/Home/HomeStrips';
import { CatalogPage } from './components/Catalog/CatalogPage';
import { ProductDetailPage } from './components/ProductDetail/ProductDetailPage';
import { CartPage } from './components/Cart/CartPage';
import { CheckoutPage } from './components/Checkout/CheckoutPage';
import { OrderTrackingPage } from './components/Tracking/OrderTrackingPage';
import { SellStuffPage } from './components/SellStuff/SellStuffPage';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { GoogleCalendarHub } from './components/Calendar/GoogleCalendarHub';
import { GoogleSheetsHub } from './components/Sheets/GoogleSheetsHub';
import { LootBotChat } from './components/Chat/LootBotChat';
import { MobileBottomNav } from './components/Navigation/MobileBottomNav';
import { Footer } from './components/Footer/Footer';
import { ErrorBoundary } from './components/Common/ErrorBoundary';

const AppContent: React.FC = () => {
  const { currentView, products, setIsVehicleModalOpen } = useStore();

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  // Merchandising Shelves
  const smashLoot = products.filter(p => p.wasPrice && p.wasPrice > p.price).slice(0, 8);
  const autoLoot = products.filter(p => p.department.includes('Auto')).slice(0, 8);
  const toolLoot = products.filter(p => p.department.includes('Tool')).slice(0, 8);
  const techLoot = products.filter(p => p.department.includes('Electronics')).slice(0, 8);
  const under20Loot = products.filter(p => p.price <= 20).slice(0, 8);
  const clearanceLoot = products.filter(p => p.isClearance || p.isUsedOrRefurb).slice(0, 8);

  return (
    <div className="min-h-screen flex flex-col bg-[#14161A] text-white selection:bg-[#B8E62E] selection:text-[#14161A] pb-16 md:pb-0 w-full max-w-full overflow-x-hidden">
      {/* Universal Global Header */}
      <Header />

      {/* Main Dynamic Viewport */}
      <main className="flex-1 w-full max-w-full min-w-0">
        {currentView === 'home' && (
          <div className="space-y-0 w-full max-w-full min-w-0">
            {/* 1. Rotating Promotional Hero Banner */}
            <HeroBanner />

            {/* 2. Hot Deals Quick Filter Pills */}
            <HotDealsPills />

            {/* 3. High Impact 6-Card Category Grid */}
            <TrendingPromoGrid />

            {/* 4. Today's Cheapest Loot Shelf */}
            {smashLoot.length > 0 && (
              <ProductShelf
                title="Today's Cheapest Loot"
                subtitle="Massive savings on verified warehouse overstock & liquidations"
                badgeText="PRICE SMASH"
                badgeColor="bg-[#E21C21] text-white"
                products={smashLoot}
                filterOption={{ isSale: true }}
              />
            )}

            {/* 5. Car Fitment Garage Strip */}
            <VehicleFitmentStrip />

            {/* 6. Featured Loot of the Day Spotlight */}
            <LootOfTheDay />

            {/* 7. Automotive & 4WD Deals Shelf */}
            {autoLoot.length > 0 && (
              <ProductShelf
                title="Automotive, 4WD & Touring Loot"
                subtitle="Alternators, socket sets, diagnostic tools & recovery accessories"
                badgeText="4WD & AUTO"
                badgeColor="bg-[#B8E62E] text-[#14161A]"
                products={autoLoot}
                targetDeptSlug="automotive"
              />
            )}

            {/* 8. Workshop & Tradie Power Tools */}
            {toolLoot.length > 0 && (
              <ProductShelf
                title="Workshop & Power Tools"
                subtitle="Socket sets, drills, impact sockets & heavy duty ratchet straps"
                badgeText="TRADIE DEALS"
                badgeColor="bg-[#202329] text-[#B8E62E]"
                products={toolLoot}
                targetDeptSlug="tools"
              />
            )}

            {/* 9. Under $20 Bargain Bin */}
            {under20Loot.length > 0 && (
              <ProductShelf
                title="Under $20 Bargain Bin"
                subtitle="Cheap accessories, GaN cables, OBD2 scanners and microfiber towels"
                badgeText="BARGAIN BIN"
                badgeColor="bg-[#E21C21] text-white"
                products={under20Loot}
                filterOption={{ maxPrice: 20 }}
              />
            )}

            {/* 10. Tech, Fast Chargers & Audio */}
            {techLoot.length > 0 && (
              <ProductShelf
                title="Tech Loot & GaN Chargers"
                subtitle="100W multi-port chargers, mechanical keyboards & certified iPads"
                badgeText="TECH LOOT"
                badgeColor="bg-blue-600 text-white"
                products={techLoot}
                targetDeptSlug="electronics"
              />
            )}

            {/* 11. Customer Acquisition Sell-To-Us Strip */}
            <SellYourStuffStrip />

            {/* 12. Buying Guides & Practical Tradie Articles */}
            <BuyingGuidesStrip />

            {/* 13. Australian Guarantees Trust Strip */}
            <TrustStrip />
          </div>
        )}

        <ErrorBoundary fallbackTitle="View Error">
          {currentView === 'catalog' && <CatalogPage />}
          {currentView === 'product' && <ProductDetailPage />}
          {currentView === 'cart' && <CartPage />}
          {currentView === 'checkout' && <CheckoutPage />}
          {currentView === 'tracking' && <OrderTrackingPage />}
          {currentView === 'sell-stuff' && <SellStuffPage />}
          {currentView === 'calendar' && <GoogleCalendarHub />}
          {currentView === 'sheets' && <GoogleSheetsHub />}
          {currentView === 'admin' && <AdminDashboard />}
        </ErrorBoundary>
      </main>

      {/* Floating AI LootBot Assistant */}
      <LootBotChat />

      {/* Universal Australian Retail Footer */}
      <Footer />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav onOpenVehicleModal={() => setIsVehicleModalOpen(true)} />
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <AppContent />
    </StoreProvider>
  );
}
