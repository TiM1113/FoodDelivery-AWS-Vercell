import { createContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

// Create the context with initial default values
const defaultContextValue = {
  food_list: [],
  cartItems: {},
  setCartItems: () => {},
  addToCart: () => Promise.resolve(),
  removeFromCart: () => Promise.resolve(),
  getTotalCartAmount: () => 0,
  url: '',
  s3Url: '',
  token: '',
  setToken: () => {}
};

export const StoreContext = createContext(defaultContextValue);

// StoreContext Provider Component
function StoreContextProvider(props) {
  // Always use production URLs for deployed frontend
  const url = import.meta.env.VITE_API_URL || "https://backend-ten-azure-58.vercel.app";
  const s3Url = import.meta.env.VITE_S3_URL || "https://food-delivery-images-bucket.s3.ap-southeast-2.amazonaws.com";
  
  // Force production URLs in production mode
  const apiUrl = import.meta.env.PROD || window.location.hostname.includes('vercel.app') 
    ? "https://backend-ten-azure-58.vercel.app" 
    : url;
  const s3BaseUrl = import.meta.env.PROD || window.location.hostname.includes('vercel.app')
    ? "https://food-delivery-images-bucket.s3.ap-southeast-2.amazonaws.com"
    : s3Url;
  
  const [food_list, setFoodList] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [token, setToken] = useState("");

  // Verify if an item exists in food_list
  const verifyItemExists = useCallback((itemId) => {
    return food_list.some(item => item._id === itemId);
  }, [food_list]);

  const addToCart = async (itemId) => {
    try {
      // Verify item exists before adding
      if (!verifyItemExists(itemId)) {
        console.warn(`Attempted to add non-existent item: ${itemId}`);
        return;
      }

      const currentItems = { ...cartItems };
      if (!currentItems[itemId]) {
        currentItems[itemId] = 1;
      } else {
        currentItems[itemId] = currentItems[itemId] + 1;
      }
      setCartItems(currentItems);

      if (token) {
        await axios.post(`${apiUrl}/api/cart/add`, { itemId }, { headers: { token } });
      }
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const currentItems = { ...cartItems };
      if (currentItems[itemId] && currentItems[itemId] > 0) {
        currentItems[itemId] -= 1;
        setCartItems(currentItems);

        if (token) {
          await axios.post(`${apiUrl}/api/cart/remove`, { itemId }, { headers: { token } });
        }
      }
    } catch (error) {
      console.error('Error removing item from cart:', error);
    }
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    if (!food_list || !food_list.length || !cartItems) return 0;
    
    try {
      Object.entries(cartItems).forEach(([itemId, quantity]) => {
        // Add validation for quantity
        const validQuantity = Math.max(0, quantity);
        
        if (validQuantity > 0) {
          const itemInfo = food_list.find(product => product._id === itemId);
          if (itemInfo && itemInfo.price) {
            const itemTotal = itemInfo.price * validQuantity;
            totalAmount += itemTotal;
          } else {
            console.warn(`Item ${itemId} not found in food list or missing price`);
          }
        }
      });
    } catch (error) {
      console.error('Error calculating total amount:', error);
    }
    
    // Round correctly for currency display
    return Math.round(totalAmount * 100) / 100;
  };

  const fetchFoodList = useCallback(async () => {
    try {
      console.log('🔍 Environment check v2:', {
        VITE_API_URL: import.meta.env.VITE_API_URL,
        url: url,
        apiUrl: apiUrl,
        mode: import.meta.env.MODE,
        dev: import.meta.env.DEV,
        hostname: window.location.hostname,
        timestamp: new Date().toISOString()
      });
      console.log('Fetching food list from:', `${apiUrl}/api/food/list`);
      const response = await axios.get(`${apiUrl}/api/food/list`);
      
      if (!response.data || !response.data.data) {
        console.error('Invalid food list response:', response);
        console.error('Response status:', response.status);
        console.error('Response headers:', response.headers);
        return;
      }
      
      // Map over the food items and ensure image URLs are correct
      const foodItems = response.data.data.map(item => ({
        ...item,
        image: item.image?.startsWith('http') 
          ? item.image 
          : `${s3BaseUrl}/${item.image.startsWith('uploads/') ? item.image : 'uploads/' + item.image}`
      }));
      
      console.log('✅ Successfully loaded', foodItems.length, 'food items');
      console.log('🔄 Setting food list state...');
      
      // Only log sample URLs in development
      if (import.meta.env.DEV) {
        console.log('Sample image URLs:', foodItems.slice(0, 2).map(item => ({ name: item.name, image: item.image })));
      }
      
      setFoodList(foodItems);
      console.log('✅ Food list state updated');
    } catch (error) {
      console.error('Error fetching food list:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        url: `${apiUrl}/api/food/list`
      });
      
      // Set empty array on error to prevent undefined issues
      setFoodList([]);
    }
  }, [apiUrl, s3BaseUrl]);

  const loadCartData = useCallback(async (userToken, foodList = []) => {
    try {
      const response = await axios.post(`${apiUrl}/api/cart/get`, {}, { headers: { token: userToken } });
      if (response.data?.cartData) {
        // Verify all items in cart exist in food_list
        const validCartData = Object.entries(response.data.cartData)
          .reduce((acc, [itemId, quantity]) => {
            const itemExists = foodList.some(item => item._id === itemId);
            // Clean and validate quantity
            const validQuantity = Math.max(0, parseInt(quantity) || 0);
            
            if (itemExists && validQuantity > 0) {
              acc[itemId] = validQuantity;
            } else if (!itemExists) {
              console.warn(`Removing non-existent item from cart: ${itemId}`);
            } else if (validQuantity <= 0) {
              console.warn(`Removing invalid quantity for item ${itemId}: ${quantity}`);
            }
            return acc;
          }, {});
        setCartItems(validCartData);
      }
    } catch (error) {
      console.error('Error loading cart data:', error);
    }
  }, [apiUrl]);

  useEffect(() => {
    async function loadData() {
      await fetchFoodList();
    }
    loadData();
  }, [fetchFoodList]);

  // Separate effect for loading cart data when token is set and food_list is available
  useEffect(() => {
    async function loadCart() {
      const savedToken = localStorage.getItem("token");
      if (savedToken && food_list.length > 0) {
        setToken(savedToken);
        await loadCartData(savedToken, food_list);
      }
    }
    loadCart();
  }, [food_list, loadCartData]);

  const contextValue = {
    food_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    url: apiUrl,
    s3Url: s3BaseUrl,
    token,
    setToken
  };

  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
}

StoreContextProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default StoreContextProvider;



