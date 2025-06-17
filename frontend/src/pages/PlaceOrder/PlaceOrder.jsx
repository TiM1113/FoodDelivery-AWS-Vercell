// Link the API orderController.js in backend with this frontend 
import { useContext, useEffect, useState } from 'react';
import './PlaceOrder.css';
import { StoreContext } from '../../context/StoreContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// the component PlaceOrder: notice that the initial capital letter in the component name
const PlaceOrder = () => {

  const { getTotalCartAmount, token, food_list, cartItems, url } = useContext(StoreContext)

  // create object to get all input field data and store them in 
  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: ""
  })

  // saving the input data in this state variable with onChangeHandler function 
  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({ ...data, [name]: value }))
  }

  // in all input tags added the name/onChange/value properties, will be verified in this useEffect, after verified the form data, the useEffect hook will be deleted.The useEffect hook in React is used for performing side effects in function components. Side effects include tasks like data fetching, subscriptions, manually changing the DOM, or verifying/validating form data.
  // useEffect(()=>{
  //   console.log(data);
  // },[data])

  // then link the data stat and onChangHandler function with the input fields(input tags) below


  // placeOrder is an async arrow function instead of PlaceOrder component to be redirected to the payment gateway 
  const placeOrder = async (event) => { // link this function to the button <button >PROCEED TO PAYMENT</button> at the bottom 
    event.preventDefault();
    
    if (!food_list || food_list.length === 0) {
      alert("Error: No food items available");
      return;
    }
    
    let orderItems = [];
    food_list.forEach((item) => {
      if (cartItems[item._id] > 0) {
        let itemInfo = { ...item }; // Create a copy to avoid mutating original
        itemInfo["quantity"] = cartItems[item._id];
        orderItems.push(itemInfo)
      }
    })
    
    if (orderItems.length === 0) {
      alert("Error: Your cart is empty");
      return;
    }
    console.log('Order items:', orderItems);
    console.log('Form data:', data);
    console.log('Total amount:', getTotalCartAmount() + 2);
    
    // create one order data variable
    let orderData = {
      address: data, // Ensure 'data' contains all necessary address details
      items: orderItems, // Ensure 'orderItems' contains valid items
      amount: getTotalCartAmount() + 2, // Calculate total properly 2 is the delivery fee
    }
    
    console.log('Sending order data:', orderData);
    try {
      console.log('Making request to:', url + "/api/order/place");
      console.log('With headers:', { token });
      
      let response = await axios.post(url + "/api/order/place", orderData, { headers: { token } })
      
      console.log('Response received:', response);
      
      if (response.data.success) {
        const { session_url } = response.data;
        window.location.replace(session_url);// Redirect to Stripe Payment Page
      }
      else {
        console.error("Order placement failed:", response.data);
        alert(`Error: ${response.data.message || 'Payment session creation failed'}`);
      }
    } catch (error) {
      console.error("Error placing order:", error);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.message || "Failed to place order. Please try again.";
      alert(`Error: ${errorMessage}`);
    }
  }

  // navigate hook
  const navigate = useNavigate();

  // add useEffect hook to ensure to navigate to the cart page
  useEffect(() => {
    if (!token) {
      navigate('/cart')
    }
    else if (getTotalCartAmount() === 0) {
      navigate('/cart')
    }
  }, [token, getTotalCartAmount, navigate])

  return (
    <form onSubmit={placeOrder} className='place-order'>
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input required name='firstName' onChange={onChangeHandler} value={data.firstName} type="text" placeholder='First name' />
          <input required name='lastName' onChange={onChangeHandler} value={data.lastName} type="text" placeholder='Last name' />
        </div>
        <input required name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Email address' />
        <input required name='street' onChange={onChangeHandler} value={data.street} type="text" placeholder='Street' />
        <div className="multi-fields">
          <input required name='city' onChange={onChangeHandler} value={data.city} type="text" placeholder='City' />
          <input required name='state' onChange={onChangeHandler} value={data.state} type="text" placeholder='State' />
        </div>
        <div className="multi-fields">
          <input required name='zipcode' onChange={onChangeHandler} value={data.zipcode} type="text" placeholder='Zip code' />
          <input required name='country' onChange={onChangeHandler} value={data.country} type="text" placeholder='Country' />
        </div>
        <input required name='phone' onChange={onChangeHandler} value={data.phone} type="text" placeholder='Phone' />
      </div>
      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotal</p>
              <p>${getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>${getTotalCartAmount() === 0 ? 0 : 2}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>${getTotalCartAmount() === 0 ? 0 : getTotalCartAmount() + 2}</b>
            </div>
          </div>
          <button type='submit'>PROCEED TO PAYMENT</button>
        </div>

      </div>
    </form>
  )
}

export default PlaceOrder
