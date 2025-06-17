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
  const url = import.meta.env.VITE_API_URL || "https://backend-ten-azure-58.vercel.app";
  const s3Url = import.meta.env.VITE_S3_URL || "https://food-delivery-images-bucket.s3.ap-southeast-2.amazonaws.com";
  
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
        currentItems[itemId] += 1;
      }
      setCartItems(currentItems);

      if (token) {
        await axios.post(`${url}/api/cart/add`, { itemId }, { headers: { token } });
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
          await axios.post(`${url}/api/cart/remove`, { itemId }, { headers: { token } });
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
        if (quantity > 0) {
          const itemInfo = food_list.find(product => product._id === itemId);
          if (itemInfo && itemInfo.price) {
            totalAmount += itemInfo.price * quantity;
          } else {
            console.warn(`Item ${itemId} not found in food list or missing price`);
          }
        }
      });
    } catch (error) {
      console.error('Error calculating total amount:', error);
    }
    
    return totalAmount;
  };

  const fetchFoodList = useCallback(async () => {
    try {
      console.log('Fetching food list from:', `${url}/api/food/list`);
      const response = await axios.get(`${url}/api/food/list`);
      
      if (!response.data || !response.data.data) {
        console.error('Invalid food list response:', response);
        return;
      }
      
      // Map over the food items and ensure image URLs are correct
      const foodItems = response.data.data.map(item => ({
        ...item,
        image: item.image?.startsWith('http') 
          ? item.image 
          : `${s3Url}/uploads/${item.image}`
      }));
      
      console.log('Processed food items:', foodItems);
      setFoodList(foodItems);
    } catch (error) {
      console.error('Error fetching food list:', error);
    }
  }, [url, s3Url]);

  const loadCartData = useCallback(async (userToken) => {
    try {
      const response = await axios.post(`${url}/api/cart/get`, {}, { headers: { token: userToken } });
      if (response.data?.cartData) {
        // Verify all items in cart exist in food_list
        const validCartData = Object.entries(response.data.cartData)
          .reduce((acc, [itemId, quantity]) => {
            if (verifyItemExists(itemId)) {
              acc[itemId] = quantity;
            } else {
              console.warn(`Removing non-existent item from cart: ${itemId}`);
            }
            return acc;
          }, {});
        setCartItems(validCartData);
      }
    } catch (error) {
      console.error('Error loading cart data:', error);
    }
  }, [url, verifyItemExists]);

  useEffect(() => {
    async function loadData() {
      await fetchFoodList();
      const savedToken = localStorage.getItem("token");
      if (savedToken) {
        setToken(savedToken);
        await loadCartData(savedToken);
      }
    }
    loadData();
  }, [fetchFoodList, loadCartData]);

  const contextValue = {
    food_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    url,
    s3Url,
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



