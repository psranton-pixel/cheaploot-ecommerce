import React, { useState } from 'react';
import { Home, Layers, Car, ShoppingCart, Menu, X, Package, Store, Tag, Sparkles, Flame, Wrench, ShieldCheck, ChevronRight, Calendar, FileSpreadsheet } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface MobileBottomNavProps {
  onOpenVehicleModal: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenVehicleModal }) => {
  const { 
    currentView, 
    setCurrentView, 
    cart, 
    userVehicle, 
    navigateToDepartment, 
    setIsChatOpen,
    setIsAiSearchActive,
    setSearchQuery
  } = useStore();

  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const totalCartQty = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <>
      {/* Fixed Mobile Bottom Navigation Bar */}
      <nav 
        id="mobile-bottom-navigation" 
        className="fixed bottom-0 left-0 right-0 z-[100] bg-[#14161A] border-t border-[#B8E62E] text-white md:hidden shadow-2xl safe-area-pb"
      >
        <div className="grid grid-cols-5 h-16 items-center px-1">
          {/* 1. Home */}
          <button
            onClick={() => {
              setCurrentView('home');
              setIsMoreMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center h-full w-full py-1 text-center transition-colors ${
              currentView === 'home' ? 'text-[#B8E62E]' : 'text-[#AEB3BA] hover:text-white'
            }`}
            id="mobile-nav-home"
          >
            <Home className="w-5 h-5 stroke-[2.2]" />
            <span className="text-[10px] font-black uppercase mt-1 tracking-tight">Home</span>
          </button>

          {/* 2. Deals / Browse */}
          <button
            onClick={() => {
              navigateToDepartment('clearance');
              setIsMoreMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center h-full w-full py-1 text-center relative transition-colors ${
              currentView === 'catalog' ? 'text-[#B8E62E]' : 'text-[#AEB3BA] hover:text-white'
            }`}
            id="mobile-nav-deals"
          >
            <div className="relative">
              <Flame className="w-5 h-5 text-[#E21C21]" />
              <span className="absolute -top-1 -right-2 bg-[#E21C21] text-white text-[8px] font-black px-1 rounded-full animate-pulse">
                HOT
              </span>
            </div>
            <span className="text-[10px] font-black uppercase mt-1 tracking-tight">Deals</span>
          </button>

          {/* 3. Garage / Vehicle Fitment */}
          <button
            onClick={() => {
              onOpenVehicleModal();
              setIsMoreMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center h-full w-full py-1 text-center transition-colors ${
              userVehicle ? 'text-[#B8E62E]' : 'text-[#AEB3BA] hover:text-white'
            }`}
            id="mobile-nav-garage"
          >
            <div className="relative">
              <Car className="w-5 h-5 stroke-[2.2]" />
              {userVehicle && (
                <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 bg-[#B8E62E] rounded-full border-2 border-[#14161A]" />
              )}
            </div>
            <span className="text-[10px] font-black uppercase mt-1 tracking-tight truncate max-w-[62px]">
              {userVehicle ? userVehicle.model : 'Garage'}
            </span>
          </button>

          {/* 4. Cart */}
          <button
            onClick={() => {
              setCurrentView('cart');
              setIsMoreMenuOpen(false);
            }}
            className={`flex flex-col items-center justify-center h-full w-full py-1 text-center relative transition-colors ${
              currentView === 'cart' ? 'text-[#B8E62E]' : 'text-[#AEB3BA] hover:text-white'
            }`}
            id="mobile-nav-cart"
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5 stroke-[2.2]" />
              {totalCartQty > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-[#B8E62E] text-[#14161A] text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-black shadow">
                  {totalCartQty}
                </span>
              )}
            </div>
            <span className="text-[10px] font-black uppercase mt-1 tracking-tight">
              {totalCartQty > 0 ? `$${cartSubtotal.toFixed(0)}` : 'Cart'}
            </span>
          </button>

          {/* 5. More / Menu Drawer */}
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={`flex flex-col items-center justify-center h-full w-full py-1 text-center transition-colors ${
              isMoreMenuOpen ? 'text-[#B8E62E]' : 'text-[#AEB3BA] hover:text-white'
            }`}
            id="mobile-nav-more"
          >
            {isMoreMenuOpen ? (
              <X className="w-5 h-5 stroke-[2.5]" />
            ) : (
              <Menu className="w-5 h-5 stroke-[2.2]" />
            )}
            <span className="text-[10px] font-black uppercase mt-1 tracking-tight">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile "More" Full-Drawer Slide-up */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-[1000] bg-black/80 md:hidden flex flex-col justify-end animate-in fade-in-50 duration-200">
          <div 
            className="bg-[#202329] text-white rounded-t-2xl border-t-2 border-[#B8E62E] max-h-[80vh] overflow-y-auto p-4 space-y-4 pb-20 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#2C3038] pb-3">
              <div className="flex items-center gap-2">
                <div className="bg-[#B8E62E] text-[#14161A] font-black px-2 py-0.5 rounded text-sm">
                  CHEAPLOOT
                </div>
                <span className="text-xs text-[#AEB3BA] font-bold">Quick Mobile Services</span>
              </div>
              <button 
                onClick={() => setIsMoreMenuOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {/* Products & Bulk Edit */}
              <button
                onClick={() => {
                  setCurrentView('admin');
                  setIsMoreMenuOpen(false);
                }}
                className="bg-[#14161A] hover:bg-[#2C3038] p-3 rounded-lg flex items-center gap-2 border border-[#FFD400]/50 text-left col-span-2 shadow"
              >
                <div className="w-6 h-6 rounded bg-[#FFD400] text-[#111111] flex items-center justify-center font-black">
                  ⚡
                </div>
                <div>
                  <div className="font-black text-[#FFD400]">Products & Bulk Edit</div>
                  <div className="text-[10px] text-gray-300">Multi-select categories, pricing & bins</div>
                </div>
              </button>

              {/* AI Search Query */}
              <button
                onClick={() => {
                  setIsAiSearchActive(true);
                  setCurrentView('catalog');
                  setIsMoreMenuOpen(false);
                }}
                className="bg-[#14161A] hover:bg-[#2C3038] p-3 rounded-lg flex items-center gap-2 border border-[#2C3038] text-left"
              >
                <Sparkles className="w-4 h-4 text-[#B8E62E] flex-shrink-0" />
                <div>
                  <div className="font-black text-white">AI Smart Search</div>
                  <div className="text-[10px] text-[#AEB3BA]">Natural language</div>
                </div>
              </button>

              {/* LootBot AI Chat */}
              <button
                onClick={() => {
                  setIsChatOpen(true);
                  setIsMoreMenuOpen(false);
                }}
                className="bg-[#14161A] hover:bg-[#2C3038] p-3 rounded-lg flex items-center gap-2 border border-[#2C3038] text-left"
              >
                <div className="w-4 h-4 rounded bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black text-[9px]">
                  CL
                </div>
                <div>
                  <div className="font-black text-[#B8E62E]">Ask LootBot AI</div>
                  <div className="text-[10px] text-[#AEB3BA]">24/7 Deal hunter</div>
                </div>
              </button>

              {/* Order Tracking */}
              <button
                onClick={() => {
                  setCurrentView('tracking');
                  setIsMoreMenuOpen(false);
                }}
                className="bg-[#14161A] hover:bg-[#2C3038] p-3 rounded-lg flex items-center gap-2 border border-[#2C3038] text-left"
              >
                <Package className="w-4 h-4 text-[#B8E62E] flex-shrink-0" />
                <div>
                  <div className="font-black text-white">Track Order</div>
                  <div className="text-[10px] text-[#AEB3BA]">AusPost tracking</div>
                </div>
              </button>

              {/* Google Sheets Sync */}
              <button
                onClick={() => {
                  setCurrentView('sheets');
                  setIsMoreMenuOpen(false);
                }}
                className="bg-[#14161A] hover:bg-[#2C3038] p-3 rounded-lg flex items-center gap-2 border border-emerald-900/60 text-left"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#0F9D58] flex-shrink-0" />
                <div>
                  <div className="font-black text-emerald-400">Google Sheets</div>
                  <div className="text-[10px] text-[#AEB3BA]">Drive sync & manifests</div>
                </div>
              </button>

              {/* Warehouse Calendar */}
              <button
                onClick={() => {
                  setCurrentView('calendar');
                  setIsMoreMenuOpen(false);
                }}
                className="bg-[#14161A] hover:bg-[#2C3038] p-3 rounded-lg flex items-center gap-2 border border-blue-900/60 text-left"
              >
                <Calendar className="w-4 h-4 text-[#4285F4] flex-shrink-0" />
                <div>
                  <div className="font-black text-[#4285F4]">Google Calendar</div>
                  <div className="text-[10px] text-[#AEB3BA]">Pickups & schedule</div>
                </div>
              </button>

              {/* Sell Your Stuff */}
              <button
                onClick={() => {
                  setCurrentView('sell-stuff');
                  setIsMoreMenuOpen(false);
                }}
                className="bg-[#14161A] hover:bg-[#2C3038] p-3 rounded-lg flex items-center gap-2 border border-[#2C3038] text-left"
              >
                <Tag className="w-4 h-4 text-[#B8E62E] flex-shrink-0" />
                <div>
                  <div className="font-black text-white">Sell To Us</div>
                  <div className="text-[10px] text-[#AEB3BA]">Instant offer</div>
                </div>
              </button>
            </div>

            {/* Vehicle Card on Mobile */}
            <div className="bg-[#14161A] border border-[#2C3038] rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black uppercase text-[#B8E62E]">My Vehicle Compatibility</div>
                    <div className="text-xs font-bold text-white">
                      {userVehicle ? `${userVehicle.year} ${userVehicle.make} ${userVehicle.model}` : 'No Vehicle Set'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onOpenVehicleModal();
                    setIsMoreMenuOpen(false);
                  }}
                  className="text-xs bg-[#B8E62E] text-[#14161A] font-black px-2.5 py-1 rounded uppercase"
                >
                  {userVehicle ? 'Edit' : 'Add'}
                </button>
              </div>
            </div>

            {/* Departments Quick List */}
            <div className="space-y-1">
              <div className="text-xs font-black uppercase text-[#B8E62E] tracking-wider mb-2">
                Browse Departments
              </div>
              {[
                { name: 'Automotive & Car Parts', slug: 'automotive' },
                { name: 'Tools & Power Tools', slug: 'tools' },
                { name: 'Electronics & Computers', slug: 'electronics' },
                { name: 'Home Appliances & Living', slug: 'home' },
                { name: 'DVDs, Vinyl & Gaming', slug: 'entertainment' },
                { name: 'Clearance & Used Loot', slug: 'clearance' }
              ].map(dept => (
                <button
                  key={dept.slug}
                  onClick={() => {
                    navigateToDepartment(dept.slug);
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left p-2 rounded hover:bg-[#14161A] text-xs font-bold flex items-center justify-between text-[#AEB3BA] hover:text-white"
                >
                  <span>{dept.name}</span>
                  <ChevronRight className="w-4 h-4 text-[#AEB3BA]" />
                </button>
              ))}
            </div>

            {/* Staff / Admin Access */}
            <div className="pt-2 border-t border-[#2C3038]">
              <button
                onClick={() => {
                  setCurrentView('admin');
                  setIsMoreMenuOpen(false);
                }}
                className="w-full bg-[#14161A] hover:bg-black p-2.5 rounded-lg text-xs font-bold text-[#B8E62E] flex items-center justify-center gap-2 border border-[#2C3038]"
              >
                <Store className="w-4 h-4" />
                <span>Warehouse Staff & Admin Command Centre</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
