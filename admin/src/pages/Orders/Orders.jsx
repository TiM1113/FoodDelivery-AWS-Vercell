import { useState, useEffect } from 'react'
import './Orders.css'
import { toast } from 'react-toastify'
import axios from 'axios'
import { assets } from '../../assets/assets'
import PropTypes from 'prop-types'

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);

  const fetchAllOrders = async () => {
    try {
      console.log('Fetching orders from:', `${url}/api/order/list`);
      const response = await axios.get(`${url}/api/order/list`);
      if (response.data.success) {
        setOrders(response.data.data);
        console.log('Orders fetched:', response.data.data);
      } else {
        toast.error("Error loading orders");
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error("Error connecting to server");
    }
  }

  const statusHandler = async (event, orderId) => {
    try {
      console.log('Updating order status:', { orderId, status: event.target.value, url: `${url}/api/order/update` });
      
      const response = await axios.post(`${url}/api/order/update`, {
        orderId,
        status: event.target.value
      });
      
      console.log('Status update response:', response.data);
      
      if (response.data.success) {
        toast.success("Order status updated");
        await fetchAllOrders();
      } else {
        console.error('Status update failed:', response.data);
        toast.error(response.data.message || "Error updating order status");
      }
    } catch (error) {
      console.error('Error updating status:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: `${url}/api/order/update`
      });
      toast.error(`Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    }
  }

  useEffect(() => {
    console.log('Orders component mounted with URL:', url);
    fetchAllOrders();
  }, [url]);

  return (
    <div className='order add'>
      <h3>Order Page</h3>
      <div className="order-list">
        {orders.map((order, index) => ( 
          <div key={order._id || index} className="order-item">
            <img src={assets.parcel_icon} alt="" />
            <div>
              <p className="order-item-food">
                {order.items.map((item, index) => {
                  if (index === order.items.length-1) {
                    return `${item.name} x ${item.quantity}`
                  }
                  return `${item.name} x ${item.quantity}, `
                })}
              </p>
              <p className="order-item-name">{`${order.address.firstName} ${order.address.lastName}`}</p>
              <div className="order-item-address">
                <p>{`${order.address.street}, `}</p>
                <p>{`${order.address.city}, ${order.address.state}, ${order.address.country}, ${order.address.zipcode}`}</p>
              </div>
              <p className="order-item-phone">{order.address.phone}</p>
            </div>
            <p>Items: {order.items.length}</p>
            <p>${order.amount}</p>
            <select onChange={(event) => statusHandler(event, order._id)} value={order.status}>
              <option value="Food Processing">Food Processing</option>
              <option value="Out for delivery">Out for delivery</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>  
        ))}
      </div>
    </div>
  )
}

Orders.propTypes = {
  url: PropTypes.string.isRequired,
}

export default Orders
