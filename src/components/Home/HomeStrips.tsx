import React, { useState } from 'react';
import { Car, CheckCircle2, ArrowRight, X, ShieldCheck } from 'lucide-react';
import { useStore } from '../../context/StoreContext';

export const VehicleFitmentStrip: React.FC = () => {
  const { userVehicle, setUserVehicle, navigateToDepartment } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [year, setYear] = useState(userVehicle?.year || 2012);
  const [make, setMake] = useState(userVehicle?.make || 'Toyota');
  const [model, setModel] = useState(userVehicle?.model || 'Hilux');

  const handleSave = () => {
    setUserVehicle({
      id: `veh-${Date.now()}`,
      year,
      make,
      model,
      engine: 'Turbo Diesel / Petrol'
    });
    setIsEditing(false);
  };

  return (
    <section className="py-4 sm:py-5 bg-[#14161A] border-b border-[#2C3038] w-full max-w-full box-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 w-full max-w-full min-w-0">
        <div className="bg-[#202329] text-white rounded-xl p-4 sm:p-5 border border-[#2C3038] hover:border-[#B8E62E] transition-colors flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg min-w-0">
          <div className="flex items-center gap-3.5 min-w-0 w-full md:w-auto">
            <div className="w-12 h-12 rounded-lg bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black flex-shrink-0">
              <Car className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="bg-[#E21C21] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  GUARANTEED FITMENT
                </span>
                <span className="text-xs text-[#AEB3BA] font-bold">CheapLoot Garage</span>
              </div>
              <h3 className="text-base sm:text-lg md:text-xl font-black text-white uppercase mt-0.5 truncate">
                {userVehicle ? (
                  <span className="text-[#B8E62E] flex items-center gap-1.5 truncate">
                    <CheckCircle2 className="w-5 h-5 text-[#B8E62E] flex-shrink-0" />
                    Selected: {userVehicle.year} {userVehicle.make} {userVehicle.model}
                  </span>
                ) : (
                  'Find Exact Parts That Fit Your Ute, 4WD or Car'
                )}
              </h3>
              <p className="text-xs text-[#AEB3BA] line-clamp-2 sm:line-clamp-1">
                {userVehicle 
                  ? 'Browsing alternators, filters, diagnostics & roof racks matched to your vehicle.' 
                  : 'Select your vehicle to filter 100% compatible car parts, alternators, sensors and recovery gear.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end min-w-0">
            {isEditing ? (
              <div className="flex flex-wrap items-center gap-2 bg-[#14161A] p-2 rounded-lg border border-[#2C3038] w-full sm:w-auto">
                <select
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className="bg-[#202329] text-white text-xs font-bold p-1.5 rounded border border-[#2C3038]"
                >
                  {[2024, 2022, 2020, 2018, 2016, 2015, 2014, 2012, 2010, 2008, 2005].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="bg-[#202329] text-white text-xs font-bold p-1.5 rounded border border-[#2C3038]"
                >
                  {['Toyota', 'Ford', 'Holden', 'Nissan', 'Mitsubishi', 'Isuzu', 'Mazda'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Model (e.g. Hilux)"
                  className="bg-[#202329] text-white text-xs font-bold p-1.5 rounded border border-[#2C3038] w-28"
                />
                <button
                  onClick={handleSave}
                  className="bg-[#B8E62E] text-[#14161A] font-black text-xs px-3 py-1.5 rounded uppercase"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-[#AEB3BA] hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-[#14161A] hover:bg-[#2C3038] border border-[#2C3038] text-white font-bold text-xs px-3.5 py-2 rounded uppercase transition-colors"
                >
                  {userVehicle ? 'Change Vehicle' : 'Add Vehicle'}
                </button>
                <button
                  onClick={() => navigateToDepartment('automotive')}
                  className="bg-[#B8E62E] hover:bg-[#c6f338] text-[#14161A] font-black text-xs px-4 py-2 rounded uppercase flex items-center gap-1.5 shadow"
                >
                  <span>Browse Auto Parts</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export const SellYourStuffStrip: React.FC = () => {
  const { setCurrentView } = useStore();

  return (
    <section className="py-6 bg-[#14161A] text-white border-b border-[#2C3038] w-full max-w-full box-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 w-full max-w-full min-w-0">
        <div className="bg-[#202329] p-5 sm:p-7 rounded-xl border border-[#2C3038] hover:border-[#B8E62E] transition-colors flex flex-col md:flex-row items-center justify-between gap-5 shadow-xl min-w-0">
          <div className="space-y-1.5 text-center md:text-left min-w-0">
            <span className="bg-[#B8E62E] text-[#14161A] text-xs font-black uppercase px-2.5 py-0.5 rounded tracking-wider inline-block">
              WE BUY INVENTORY
            </span>
            <h3 className="text-lg sm:text-2xl lg:text-3xl font-black text-white uppercase tracking-tight break-words">
              Got Tools, Tech, Auto Parts or Media to Sell?
            </h3>
            <p className="text-xs sm:text-sm text-[#AEB3BA] max-w-2xl font-medium">
              CheapLoot buys workshop clearances, excess business stock, trade lots, vinyl collections and electronics with fast inspection and same-day direct bank transfer!
            </p>
          </div>

          <button
            onClick={() => setCurrentView('sell-stuff')}
            className="bg-[#B8E62E] hover:bg-[#c6f338] text-[#14161A] font-black text-xs sm:text-sm px-5 sm:px-6 py-3 rounded-lg uppercase tracking-wider flex items-center gap-2 shadow-lg transition-transform active:scale-95 flex-shrink-0"
          >
            <span>SUBMIT FOR INSTANT QUOTE</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </section>
  );
};

export const BuyingGuidesStrip: React.FC = () => {
  const { navigateToDepartment } = useStore();

  const articles = [
    {
      id: 'g-1',
      title: 'How to Choose the Right Alternator for Hilux & 4WD Touring Dual Batteries',
      category: 'Automotive Guide',
      readTime: '4 min read',
      image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=400&auto=format&fit=crop&q=80',
      dept: 'automotive'
    },
    {
      id: 'g-2',
      title: '72-Tooth vs 36-Tooth Ratchets: What Aussie Mechanics Actually Need',
      category: 'Tools & Workshop',
      readTime: '3 min read',
      image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=80',
      dept: 'tools'
    },
    {
      id: 'g-3',
      title: 'GaN Fast Chargers Explained: Why Gallium Nitride Destroys Silicon Bricks',
      category: 'Tech Buying Guide',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&auto=format&fit=crop&q=80',
      dept: 'electronics'
    }
  ];

  return (
    <section className="py-6 sm:py-8 bg-[#14161A] border-b border-[#2C3038] w-full max-w-full box-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 w-full max-w-full min-w-0">
        <div className="flex items-center justify-between mb-4 border-b border-[#2C3038] pb-2 min-w-0">
          <div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white uppercase tracking-tight">
              CheapLoot Buying Guides & Aussie Advice
            </h2>
            <p className="text-xs text-[#AEB3BA] font-medium">
              Practical tradie knowledge, workshop tips and bargain shopping guides
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
          {articles.map((art) => (
            <div
              key={art.id}
              onClick={() => navigateToDepartment(art.dept)}
              className="bg-[#202329] rounded-xl border border-[#2C3038] hover:border-[#B8E62E] overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="aspect-video w-full overflow-hidden bg-[#14161A] relative">
                <img
                  src={art.image}
                  alt={art.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-2 left-2 bg-[#14161A] text-[#B8E62E] text-[10px] font-black uppercase px-2 py-0.5 rounded border border-[#2C3038]">
                  {art.category}
                </span>
              </div>
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] text-[#AEB3BA] font-semibold mb-1">{art.readTime}</div>
                  <h3 className="font-bold text-sm text-white group-hover:text-[#B8E62E] line-clamp-2 leading-snug">
                    {art.title}
                  </h3>
                </div>
                <div className="text-xs font-black text-[#B8E62E] group-hover:text-white flex items-center gap-1 mt-3">
                  <span>Read Guide & Recommended Loot</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const TrustStrip: React.FC = () => {
  return (
    <section className="py-6 bg-[#14161A] text-white border-t border-[#2C3038] w-full max-w-full box-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 w-full max-w-full min-w-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center sm:text-left min-w-0">
          <div className="flex flex-col sm:flex-row items-center gap-3 p-2 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black flex-shrink-0 text-base">
              🦘
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black uppercase text-white truncate">Australian Stock</div>
              <div className="text-[11px] text-[#AEB3BA] font-medium truncate">Geelong & Werribee depots</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 p-2 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black flex-shrink-0 text-base">
              ⚡
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black uppercase text-white truncate">Fast Direct Dispatch</div>
              <div className="text-[11px] text-[#AEB3BA] font-medium truncate">Orders packed in 24 hours</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 p-2 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black flex-shrink-0 text-base">
              🛡️
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black uppercase text-white truncate">30-Day Easy Returns</div>
              <div className="text-[11px] text-[#AEB3BA] font-medium truncate">Aussie Consumer Law backed</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 p-2 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#B8E62E] text-[#14161A] flex items-center justify-center font-black flex-shrink-0 text-base">
              🔒
            </div>
            <div className="min-w-0">
              <div className="text-xs font-black uppercase text-white truncate">Secure AU Payments</div>
              <div className="text-[11px] text-[#AEB3BA] font-medium truncate">Card, PayPal, Afterpay, Zip</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
