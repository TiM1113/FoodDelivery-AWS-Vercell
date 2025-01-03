import { createContext, useEffect, useState } from 'react';
//import {food_list} from '../assets/assets'; //we don't need to import food_list form assets folder anymore.
import axios from 'axios';
export const StoreContext = createContext(null);


const StoreContextProvider = (props) => {

  const url = "https://project-fooddelivery.onrender.com"; // this url variable will be passed in the context value
  const [food_list, setFoodList] = useState([]);// to create one state variable to save food like to database instead of loading assets from local assets folder.
  const [cartItems, setCartItems] = useState({}); // save the cart data fetched with 3- loadCartData function in this cartItems variable
  const [token, setToken] = useState(""); // to create one token state variable default it as empty ""


  // 1- addToCart : this is the frontend addToCart function, align with backend addToCart function to process cart logic
  const addToCart = async (itemId) => {
    if (!cartItems[itemId]) {
      setCartItems((prev) => ({ ...prev, [itemId]: 1 }));
    } else {
      setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] + 1 }));
    }
    // add another if else statement to check a token weather available, then update to backend database. after this, addToCart function will be convert to async function
    // await keyword can only exist within async function
    if (token) {
      await axios.post(url + "/api/cart/add", { itemId }, { headers: { token } })
    }
  };


  // 2- removeFromCart
  const removeFromCart = async (itemId) => {
    setCartItems((prev) => ({ ...prev, [itemId]: prev[itemId] - 1 }));
    // add await keyword to integrate async function
    if (token) {
      await axios.post(url + "/api/cart/remove", { itemId }, { headers: { token } })
    }
  };


  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      try {
        if (cartItems[item] > 0) {
          let itemInfo = food_list.find((product) => product._id === item);
          totalAmount += itemInfo.price * cartItems[item];
        }
      } catch (error) {

      }
    }
    return totalAmount;
  };


  const fetchFoodList = async () => {
    const response = await axios.get(url + "/api/food/list");
    setFoodList(response.data.data);
  }

  //3- extremely crucial step to fix webpage refreshing data lost issue, create one arrow function to fetch food list from the database: to create one arrow function to load cart data
  // use this async function to call API -> this loadCartData function will always be called whenever the webpage is reloaded.
  // **** in below async arrow function, I forgot to pass token in () to cause a consistent error "Uncaught TypeError: Cannot read properties of undefined (reading '...') at FoodItem (FoodItem.jsx:18:7)"
  // undefined: You're trying to access a property on something that is undefined.
  // cartItems[id]: Specifically, it's happening when you're trying to use a id to access an element within the cartItems object. This likely means that, at that specific line, the object or the id variable is undefined.
  const loadCartData = async (token) => {
    // get the cart data and save it in cartItems variable
    const response = await axios.post(url + "/api/cart/get", {}, { headers: { token } })
    setCartItems(response.data.cartData); // load cart data in this state
  }

  //4- use useEffect function to save token state within local storage
  useEffect(() => {
    async function loadData() {
      await fetchFoodList();
      if (localStorage.getItem("token")) {
        setToken(localStorage.getItem("token"));
        // call the loadCartData function here to fetch tha cart data from local data storage
        await loadCartData(localStorage.getItem("token"));
      }
    }
    loadData();
  }, [])


  const contextValue = {
    food_list,
    cartItems,
    setCartItems,
    addToCart,
    removeFromCart,
    getTotalCartAmount,
    url,// pass the url variable as value in content
    token,
    setToken
  };
  return (
    <StoreContext.Provider value={contextValue}>
      {props.children}
    </StoreContext.Provider>
  );
};


export default StoreContextProvider;



