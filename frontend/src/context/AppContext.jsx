import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI, productsAPI, suppliersAPI, transactionsAPI } from '../utils/api';
import confetti from 'canvas-confetti';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const [authLoading, setAuthLoading] = useState(true);
  
  // App Core State
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [stateLoading, setStateLoading] = useState(false);

  // Cart Register State
  const [cart, setCart] = useState([]);

  // Toast Alerts State
  const [notification, setNotification] = useState(null);

  // Trigger visual notification banner
  const triggerNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Validate session on boot
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setIsAuthenticated(true);
          // Sync check with API
          const response = await authAPI.getCurrentUser();
          if (response.user) {
            setUser(response.user);
            localStorage.setItem('user', JSON.stringify(response.user));
          }
        } catch (error) {
          console.warn('Session restoration failed:', error.message);
          logout();
        }
      }
      setAuthLoading(false);
    };

    initAuth();
  }, [token]);

  // Fetch core data upon successful login
  useEffect(() => {
    if (isAuthenticated) {
      fetchCoreData();
    } else {
      // Clear data if not authenticated
      setProducts([]);
      setSuppliers([]);
      setTransactions([]);
      setLowStockProducts([]);
      setCart([]);
    }
  }, [isAuthenticated]);

  const fetchCoreData = async () => {
    setStateLoading(true);
    try {
      const [prodsData, suppData, txData, lowStockData] = await Promise.all([
        productsAPI.getAll(),
        suppliersAPI.getAll(),
        transactionsAPI.getAll(),
        productsAPI.getLowStock()
      ]);
      
      setProducts(prodsData);
      setSuppliers(suppData);
      setTransactions(txData);
      setLowStockProducts(lowStockData);
    } catch (error) {
      console.error('Failed to load application data:', error);
      triggerNotification('Failed to load real-time stock lists. Backend may be offline.', 'error');
    } finally {
      setStateLoading(false);
    }
  };

  // Authentication Handlers
  const login = async (email, password) => {
    setAuthLoading(true);
    try {
      const data = await authAPI.login(email, password);
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      triggerNotification(`Welcome back, ${data.user.username}!`, 'success');
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Authentication failed. Please verify credentials.';
      triggerNotification(message, 'error');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (username, email, password) => {
    setAuthLoading(true);
    try {
      const data = await authAPI.register(username, email, password);
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      triggerNotification('Account registered successfully!', 'success');
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Registration failed.';
      triggerNotification(message, 'error');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    triggerNotification('Logged out successfully.', 'info');
  };

  const resetPassword = async (email, newPassword, confirmPassword) => {
    try {
      const data = await authAPI.resetPassword(email, newPassword, confirmPassword);
      triggerNotification(data.message || 'Password reset successful!', 'success');
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Password reset failed.';
      triggerNotification(message, 'error');
      throw error;
    }
  };

  // CRUD Wrapper Operations
  const addProduct = async (productData) => {
    try {
      const newProd = await productsAPI.create(productData);
      triggerNotification(`Product "${newProd.name}" added.`, 'success');
      await fetchCoreData();
      return newProd;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create product.';
      triggerNotification(message, 'error');
      throw error;
    }
  };

  const updateProduct = async (id, productData) => {
    try {
      const updated = await productsAPI.update(id, productData);
      triggerNotification(`Product "${updated.name}" updated.`, 'success');
      await fetchCoreData();
      return updated;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update product.';
      triggerNotification(message, 'error');
      throw error;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await productsAPI.delete(id);
      triggerNotification('Product removed from catalog.', 'success');
      await fetchCoreData();
      return true;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete product.';
      triggerNotification(message, 'error');
      throw error;
    }
  };

  const addSupplier = async (supplierData) => {
    try {
      const newSupp = await suppliersAPI.create(supplierData);
      triggerNotification(`Supplier "${newSupp.name}" registered.`, 'success');
      await fetchCoreData();
      return newSupp;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to create supplier.';
      triggerNotification(message, 'error');
      throw error;
    }
  };

  const recordStockTransaction = async (productId, type, qty) => {
    try {
      const response = await transactionsAPI.create({
        product_id: productId,
        transaction_type: type,
        quantity: qty
      });
      await fetchCoreData();
      return response;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to complete transaction.';
      triggerNotification(message, 'error');
      throw error;
    }
  };

  // Cart Register Operations
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        if (existing.cartQty + 1 > product.stock_quantity) {
          triggerNotification(`Insufficient stock available for ${product.name}!`, 'error');
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, cartQty: item.cartQty + 1 } : item
        );
      } else {
        if (product.stock_quantity < 1) {
          triggerNotification(`"${product.name}" is out of stock!`, 'error');
          return prevCart;
        }
        triggerNotification(`Added ${product.name} to sales register.`, 'success');
        return [...prevCart, { ...product, cartQty: 1 }];
      }
    });
  };

  const removeFromCart = (id) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  };

  const updateCartQty = (id, newQty, maxStock) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    if (newQty > maxStock) {
      triggerNotification(`Only ${maxStock} units of this product are in stock.`, 'error');
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) => (item.id === id ? { ...item, cartQty: newQty } : item))
    );
  };

  const clearCart = () => setCart([]);

  const checkoutCart = async () => {
    if (cart.length === 0) return;
    setStateLoading(true);
    try {
      // Execute transactions sequentially or in parallel
      const promises = cart.map((item) =>
        transactionsAPI.create({
          product_id: item.id,
          transaction_type: 'OUT',
          quantity: item.cartQty
        })
      );
      await Promise.all(promises);
      
      // Wow confetti micro-animation!
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 }
      });

      triggerNotification(`Checkout successful! Handoff complete.`, 'success');
      setCart([]);
      await fetchCoreData();
    } catch (error) {
      const message = error.response?.data?.error || 'Checkout failed. Stock counts may have shifted.';
      triggerNotification(message, 'error');
    } finally {
      setStateLoading(false);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        authLoading,
        stateLoading,
        products,
        suppliers,
        transactions,
        lowStockProducts,
        cart,
        notification,
        login,
        register,
        logout,
        resetPassword,
        fetchCoreData,
        addProduct,
        updateProduct,
        deleteProduct,
        addSupplier,
        recordStockTransaction,
        addToCart,
        removeFromCart,
        updateCartQty,
        clearCart,
        checkoutCart,
        triggerNotification
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
