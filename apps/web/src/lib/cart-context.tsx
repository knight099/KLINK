import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from './api';

export interface CartItem {
  supplierProductId: string;
  masterProductName: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  deliveryCharge: number;
}

interface CartContextType {
  supplierId: string | null;
  supplierName: string | null;
  items: CartItem[];
  addItem: (
    supplierId: string,
    supplierName: string,
    item: Omit<CartItem, 'quantity'>,
    quantity?: number
  ) => boolean;
  updateQuantity: (supplierProductId: string, quantity: number) => void;
  removeItem: (supplierProductId: string) => void;
  clearCart: () => void;
  refreshCartPrices: () => Promise<void>;
  totalMaterialAmount: number;
  deliveryCharge: number;
  finalTotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [supplierId, setSupplierId] = useState<string | null>(() => localStorage.getItem('klink_cart_supplier_id'));
  const [supplierName, setSupplierName] = useState<string | null>(() => localStorage.getItem('klink_cart_supplier_name'));
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('klink_cart_items');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('klink_cart_items', JSON.stringify(items));
    if (supplierId) localStorage.setItem('klink_cart_supplier_id', supplierId);
    else localStorage.removeItem('klink_cart_supplier_id');
    if (supplierName) localStorage.setItem('klink_cart_supplier_name', supplierName);
    else localStorage.removeItem('klink_cart_supplier_name');
  }, [items, supplierId, supplierName]);

  const addItem = (
    newSupplierId: string,
    newSupplierName: string,
    item: Omit<CartItem, 'quantity'>,
    quantity = 1
  ): boolean => {
    // Single supplier cart rule (Roadmap Section 9)
    if (supplierId && supplierId !== newSupplierId && items.length > 0) {
      const confirmSwitch = window.confirm(
        `Your cart already has items from "${supplierName}".\n\nConstruction marketplace orders are fulfilled by 1 supplier per order.\n\nDo you want to clear your current cart and start a new order with "${newSupplierName}"?`
      );
      if (!confirmSwitch) return false;

      // Reset cart to new supplier
      setSupplierId(newSupplierId);
      setSupplierName(newSupplierName);
      setItems([{ ...item, quantity }]);
      return true;
    }

    setSupplierId(newSupplierId);
    setSupplierName(newSupplierName);

    setItems((prev) => {
      const existing = prev.find((i) => i.supplierProductId === item.supplierProductId);
      if (existing) {
        return prev.map((i) =>
          i.supplierProductId === item.supplierProductId
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...item, quantity }];
    });

    return true;
  };

  const updateQuantity = (supplierProductId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(supplierProductId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.supplierProductId === supplierProductId ? { ...i, quantity } : i))
    );
  };

  const removeItem = (supplierProductId: string) => {
    setItems((prev) => {
      const updated = prev.filter((i) => i.supplierProductId !== supplierProductId);
      if (updated.length === 0) {
        setSupplierId(null);
        setSupplierName(null);
      }
      return updated;
    });
  };

  const clearCart = () => {
    setItems([]);
    setSupplierId(null);
    setSupplierName(null);
  };

  const refreshCartPrices = async () => {
    if (!supplierId || items.length === 0) return;
    try {
      const res = await apiFetch<any>(`/marketplace/suppliers/${supplierId}/storefront`);
      if (res && res.products) {
        const prodMap = new Map<string, any>(res.products.map((p: any) => [p.id, p]));
        setItems((prev) =>
          prev.map((item) => {
            const live = prodMap.get(item.supplierProductId);
            if (live) {
              return {
                ...item,
                unitPrice: live.sellingPrice ?? item.unitPrice,
                deliveryCharge: live.deliveryCharge ?? item.deliveryCharge
              };
            }
            return item;
          })
        );
      }
    } catch {
      // ignore
    }
  };

  const totalMaterialAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const deliveryCharge = items.reduce((max, item) => Math.max(max, item.deliveryCharge), 0);
  const finalTotal = totalMaterialAmount + deliveryCharge;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        supplierId,
        supplierName,
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCartPrices,
        totalMaterialAmount,
        deliveryCharge,
        finalTotal,
        itemCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

