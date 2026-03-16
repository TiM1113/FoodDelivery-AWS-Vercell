import { createContext, useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import { API_BASE_URL, S3_BASE_URL } from '@food-delivery/shared';

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

function StoreContextProvider(props) {
  const apiUrl = import.meta.env.VITE_API_URL || API_BASE_URL;
  const s3BaseUrl = import.meta.env.VITE_S3_URL || S3_BASE_URL;

  const [food_list, setFoodList] = useState([]);
  const [cartItems, setCartItems] = useState({});
  // token is a flag: "" = logged out, "logged-in" = authenticated via httpOnly Cookie
  const [token, setToken] = useState('');

  const verifyItemExists = useCallback((itemId) => {
    return food_list.some(item => item._id === itemId);
  }, [food_list]);

  const addToCart = async (itemId) => {
    try {
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
        await axios.post(`${apiUrl}/api/cart/add`, { itemId }, { withCredentials: true });
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
          await axios.post(`${apiUrl}/api/cart/remove`, { itemId }, { withCredentials: true });
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
        const validQuantity = Math.max(0, quantity);
        if (validQuantity > 0) {
          const itemInfo = food_list.find(product => product._id === itemId);
          if (itemInfo && itemInfo.price) {
            totalAmount += itemInfo.price * validQuantity;
          } else {
            console.warn(`Item ${itemId} not found in food list or missing price`);
          }
        }
      });
    } catch (error) {
      console.error('Error calculating total amount:', error);
    }

    return Math.round(totalAmount * 100) / 100;
  };

  const addOrderToCart = async (orderItems) => {
    try {
      if (!orderItems || !Array.isArray(orderItems)) {
        return { success: false, message: 'Invalid order items' };
      }

      let itemsAdded = 0;
      let itemsNotFound = 0;

      for (const orderItem of orderItems) {
        const foodItem = food_list.find(food => food.name === orderItem.name);
        if (foodItem) {
          for (let i = 0; i < orderItem.quantity; i++) {
            await addToCart(foodItem._id);
          }
          itemsAdded += orderItem.quantity;
        } else {
          console.warn(`Food item not found: ${orderItem.name}`);
          itemsNotFound++;
        }
      }

      const message = itemsNotFound > 0
        ? `${itemsAdded} items added to cart. ${itemsNotFound} items not found.`
        : `${itemsAdded} items added to cart successfully!`;

      return { success: itemsAdded > 0, message, itemsAdded, itemsNotFound };
    } catch (error) {
      console.error('Error adding order to cart:', error);
      return { success: false, message: 'Error adding items to cart' };
    }
  };

  const fetchFoodList = useCallback(async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/food/list`);

      if (!response.data || !response.data.data) {
        console.error('Invalid food list response:', response);
        return;
      }

      const foodItems = response.data.data.map(item => ({
        ...item,
        image: !item.image
          ? null
          : item.image.startsWith('http')
            ? item.image
            : `${s3BaseUrl}/${item.image.startsWith('uploads/') ? item.image : 'uploads/' + item.image}`
      }));

      setFoodList(foodItems);
    } catch (error) {
      console.error('Error fetching food list:', error);
      setFoodList([]);
    }
  }, [apiUrl, s3BaseUrl]);

  const loadCartData = useCallback(async (foodList = []) => {
    try {
      const response = await axios.post(
        `${apiUrl}/api/cart/get`,
        {},
        { withCredentials: true }
      );
      if (response.data?.cartData) {
        const validCartData = Object.entries(response.data.cartData)
          .reduce((acc, [itemId, quantity]) => {
            const itemExists = foodList.some(item => item._id === itemId);
            const validQuantity = Math.max(0, parseInt(quantity) || 0);
            if (itemExists && validQuantity > 0) {
              acc[itemId] = validQuantity;
            }
            return acc;
          }, {});
        setCartItems(validCartData);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading cart data:', error);
      return false;
    }
  }, [apiUrl]);

  useEffect(() => {
    async function loadData() {
      await fetchFoodList();
    }
    loadData();
  }, [fetchFoodList]);

  useEffect(() => {
    async function loadCart() {
      const wasLoggedIn = localStorage.getItem('isLoggedIn');
      if (wasLoggedIn && food_list.length > 0) {
        const isAuth = await loadCartData(food_list);
        if (isAuth) {
          setToken('logged-in');
        } else {
          localStorage.removeItem('isLoggedIn');
        }
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
    addOrderToCart,
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
