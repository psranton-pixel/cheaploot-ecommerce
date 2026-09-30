import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, CartItem, UserVehicle, Order, CategoryDepartment } from '../types';
import { INITIAL_DEPARTMENTS, INITIAL_PRODUCTS, INITIAL_ORDERS } from '../data/mockData';

interface StoreContextType {
  products: Product[];
  departments: CategoryDepartment[];
  cart: CartItem[];
  wishlist: string[];
  recentlyViewed: Product[];
  userVehicle: UserVehicle | null;
  orders: Order[];
  currentView: string;
  selectedProductId: string | null;
  selectedDepartment: string | null;
  selectedCategory: string | null;
  searchQuery: string;
  isAiSearchActive: boolean;
  isChatOpen: boolean;
  isVehicleModalOpen: boolean;
  activeFilters: {
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    isClearance?: boolean;
    isSale?: boolean;
    isHotDeal?: boolean;
    isUsedOrRefurb?: boolean;
    sort?: string;
  };
  // Actions
  setCurrentView: (view: string) => void;
  navigateToProduct: (productId: string) => void;
  navigateToDepartment: (deptSlug: string | null, catSlug?: string | null) => void;
  setSearchQuery: (q: string) => void;
  setIsAiSearchActive: (active: boolean) => void;
  setIsChatOpen: (open: boolean) => void;
  setIsVehicleModalOpen: (open: boolean) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQty: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  setUserVehicle: (vehicle: UserVehicle | null) => void;
  updateFilters: (filters: Partial<StoreContextType['activeFilters']>) => void;
  refreshProducts: () => Promise<void>;
  addNewProduct: (product: Product) => void;
  addNewOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: any, note?: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [departments] = useState<CategoryDepartment[]>(INITIAL_DEPARTMENTS);
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('cheaploot_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('cheaploot_wishlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [userVehicle, setUserVehicleState] = useState<UserVehicle | null>(() => {
    const saved = localStorage.getItem('cheaploot_vehicle');
    return saved ? JSON.parse(saved) : null;
  });
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [currentView, setCurrentView] = useState<string>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAiSearchActive, setIsAiSearchActive] = useState<boolean>(false);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<StoreContextType['activeFilters']>({
    sort: 'popular'
  });

  // Load Initial Products and Orders from API (with robust offline fallback)
  const refreshProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      if (data && data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch {
      // Graceful fallback
    }
  };

  const refreshOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      if (data && data.success && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch {
      // Graceful fallback
    }
  };

  useEffect(() => {
    refreshProducts();
    refreshOrders();
  }, []);

  // Sync cart to local storage
  useEffect(() => {
    localStorage.setItem('cheaploot_cart', JSON.stringify(cart));
  }, [cart]);

  // Sync wishlist to local storage
  useEffect(() => {
    localStorage.setItem('cheaploot_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Sync vehicle to local storage
  const setUserVehicle = (vehicle: UserVehicle | null) => {
    setUserVehicleState(vehicle);
    if (vehicle) {
      localStorage.setItem('cheaploot_vehicle', JSON.stringify(vehicle));
    } else {
      localStorage.removeItem('cheaploot_vehicle');
    }
  };

  const navigateToProduct = (productId: string) => {
    setSelectedProductId(productId);
    setCurrentView('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Add to recently viewed
    const prod = products.find(p => p.id === productId);
    if (prod) {
      setRecentlyViewed(prev => {
        const filtered = prev.filter(p => p.id !== productId);
        return [prod, ...filtered].slice(0, 8);
      });
    }
  };

  const navigateToDepartment = (deptSlug: string | null, catSlug?: string | null) => {
    setSelectedDepartment(deptSlug);
    setSelectedCategory(catSlug || null);
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (product: Product, quantity = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(product.stock, item.quantity + quantity) }
            : item
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateCartQty = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(item.product.stock, quantity) }
          : item
      )
    );
  };

  const clearCart = () => setCart([]);

  const toggleWishlist = (productId: string) => {
    setWishlist(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  const updateFilters = (filters: Partial<StoreContextType['activeFilters']>) => {
    setActiveFilters(prev => ({ ...prev, ...filters }));
  };

  const addNewProduct = (product: Product) => {
    setProducts(prev => [product, ...prev]);
  };

  const addNewOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
  };

  const updateOrderStatus = (orderId: string, status: any, note?: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId || o.orderNumber === orderId) {
          return {
            ...o,
            status,
            updatedAt: new Date().toISOString(),
            timeline: [
              {
                id: `act-${Date.now()}`,
                timestamp: new Date().toISOString(),
                status,
                note: note || `Order updated to ${status}`,
                author: 'Warehouse Dispatch'
              },
              ...o.timeline
            ]
          };
        }
        return o;
      })
    );
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        departments,
        cart,
        wishlist,
        recentlyViewed,
        userVehicle,
        orders,
        currentView,
        selectedProductId,
        selectedDepartment,
        selectedCategory,
        searchQuery,
        isAiSearchActive,
        isChatOpen,
        isVehicleModalOpen,
        activeFilters,
        setCurrentView,
        navigateToProduct,
        navigateToDepartment,
        setSearchQuery,
        setIsAiSearchActive,
        setIsChatOpen,
        setIsVehicleModalOpen,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        toggleWishlist,
        setUserVehicle,
        updateFilters,
        refreshProducts,
        addNewProduct,
        addNewOrder,
        updateOrderStatus
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within StoreProvider');
  return context;
};
