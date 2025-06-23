import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_ITEM':
      // Check if item already exists
      const existingItemIndex = state.items.findIndex(
        item => item._id === action.payload._id && item.itemType === action.payload.itemType
      );
      if (existingItemIndex > -1) {
        // Increase quantity if item exists
        const updatedItems = state.items.map((item, index) =>
          index === existingItemIndex
            ? { ...item, quantity: item.quantity + (action.payload.quantity || 1) }
            : item
        );
        return { ...state, items: updatedItems };
      } else {
        // Add new item
        return { ...state, items: [...state.items, { ...action.payload, quantity: action.payload.quantity || 1 }] };
      }
    case 'REMOVE_ITEM':
      // Remove item by its unique cart ID (or combination of _id and itemType if _id isn't unique across products/services in cart)
      // For simplicity, assuming action.payload is the _id of the item to remove.
      // If itemType matters for removal, action.payload should be an object { _id, itemType }
      return {
        ...state,
        items: state.items.filter(item => !(item._id === action.payload._id && item.itemType === action.payload.itemType)),
      };
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          (item._id === action.payload._id && item.itemType === action.payload.itemType)
            ? { ...item, quantity: Math.max(1, action.payload.quantity) } // Ensure quantity is at least 1
            : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    case 'LOAD_CART': // Load cart from localStorage
        return action.payload;
    default:
      return state;
  }
};

const initialState = {
  items: [],
  // We can add other cart properties here like totalAmount, itemCount, etc.,
  // which can be derived or stored.
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState, (initial) => {
    // Load cart from localStorage on initial load
    try {
      const localData = localStorage.getItem('cart');
      return localData ? JSON.parse(localData) : initial;
    } catch (error) {
      console.error("Error parsing cart from localStorage", error);
      return initial;
    }
  });

  useEffect(() => {
    // Persist cart to localStorage whenever it changes
    localStorage.setItem('cart', JSON.stringify(state));
  }, [state]);

  const addItem = (item) => { // item should include _id, name, price, itemType, sellerId, and optionally image
    dispatch({ type: 'ADD_ITEM', payload: item });
  };

  const removeItem = (itemId, itemType) => { // Pass both to uniquely identify
    dispatch({ type: 'REMOVE_ITEM', payload: { _id: itemId, itemType } });
  };

  const updateQuantity = (itemId, itemType, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { _id: itemId, itemType, quantity: parseInt(quantity, 10) } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  // Derived values
  const itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = state.items.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);


  return (
    <CartContext.Provider value={{ cartState: state, addItem, removeItem, updateQuantity, clearCart, itemCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  return useContext(CartContext);
};
