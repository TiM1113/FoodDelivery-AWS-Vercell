import { useContext, useEffect, useState, useCallback } from 'react'
import './MyOrders.css'
import axios from 'axios'
import { StoreContext } from '../../context/StoreContext';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';

const MyOrders = () => {
  
  const [data,setData] =  useState([]);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const {url,token} = useContext(StoreContext);
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    try {
      const response = await axios.post(url+"/api/order/userorders",{},{headers:{token}});
      setData(response.data.data);
      console.log('Orders updated:', response.data.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  }, [url, token]);

  const handleTrackOrder = (order) => {
    setTrackingOrder(order);
    // Refresh orders to get latest status
    fetchOrders();
  };

  const closeTracking = () => {
    setTrackingOrder(null);
  };

  const handleDishClick = (dishName) => {
    // Navigate to home page with search query for the specific dish
    navigate('/', { state: { searchQuery: dishName } });
  };

  const handleRetryPayment = async (order) => {
    try {
      console.log('Retrying payment for order:', order._id);
      
      // Create order data for retry payment
      const orderData = {
        address: order.address,
        items: order.items,
        amount: order.amount,
        isRetry: true,
        originalOrderId: order._id
      };
      
      const response = await axios.post(url + "/api/order/place", orderData, { headers: { token } });
      
      if (response.data.success) {
        const { session_url } = response.data;
        window.location.replace(session_url); // Redirect to Stripe Payment Page
      } else {
        alert(`Error: ${response.data.message || 'Payment retry failed'}`);
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      alert(`Error: ${error.response?.data?.message || 'Failed to retry payment'}`);
    }
  };

  const getPaymentStatus = (payment) => {
    if (payment === true) {
      return <span className="payment-status paid">💳 Paid</span>;
    } else {
      return <span className="payment-status unpaid">❌ Unpaid</span>;
    }
  };

  const renderDishNames = (items) => {
    return items.map((item, index) => (
      <span key={index}>
        <span 
          className="dish-name-link" 
          onClick={() => handleDishClick(item.name)}
          title={`Click to view ${item.name}`}
        >
          {item.name}
        </span>
        <span> x {item.quantity}</span>
        {index < items.length - 1 && <span>, </span>}
      </span>
    ));
  };

  useEffect(()=>{
    if (token) {
      fetchOrders();
    }
  },[token, fetchOrders])

  return (
    <div className='my-orders'>
      
      <h2>My Orders</h2>
      <div className="container">
        {data.map((order,index)=>{
          // Helper function to get status indicator
          const getStatusIndicator = (status) => {
            switch(status) {
              case 'Delivered':
                return <span className="status-indicator delivered">✓</span>;
              case 'Out for delivery':
                return <span className="status-indicator out-for-delivery">🚚</span>;
              case 'Food Processing':
                return <span className="status-indicator processing">⏳</span>;
              default:
                return <span className="status-indicator default">●</span>;
            }
          };

          return (
            <div key={index} className='my-orders-order'>
                <div className="order-number">#{data.length - index}</div>
                <img src={assets.parcel_icon} alt="" />
                <p>{renderDishNames(order.items)}</p>
                <p>${order.amount}.00</p>
                <p>Items: {order.items.length}</p>
                <p>{getPaymentStatus(order.payment)}</p>
                <p>{getStatusIndicator(order.status)} <b>{order.status}</b></p>
                <div className="order-actions">
                  <button onClick={() => handleTrackOrder(order)}>Track Order</button>
                  {!order.payment && (
                    <button 
                      className="retry-payment-btn" 
                      onClick={() => handleRetryPayment(order)}
                    >
                      Retry Payment
                    </button>
                  )}
                </div>
            </div>
          )
        })}
      </div>

      {/* Order Tracking Modal */}
      {trackingOrder && (
        <div className="tracking-modal">
          <div className="tracking-content">
            <div className="tracking-header">
              <h3>Order Tracking</h3>
              <button className="close-btn" onClick={closeTracking}>×</button>
            </div>
            <div className="tracking-details">
              <p><strong>Order ID:</strong> {trackingOrder._id}</p>
              <p><strong>Status:</strong> <span className={`status ${trackingOrder.status.toLowerCase().replace(' ', '-')}`}>{trackingOrder.status}</span></p>
              <p><strong>Amount:</strong> ${trackingOrder.amount}.00</p>
              <p><strong>Payment:</strong> {trackingOrder.payment ? 'Paid' : 'Pending'}</p>
              
              <div className="order-progress">
                <div className={`progress-step ${['Food Processing', 'Out for delivery', 'Delivered'].includes(trackingOrder.status) ? 'completed' : ''}`}>
                  <div className="step-icon">1</div>
                  <div className="step-text">Food Processing</div>
                </div>
                <div className={`progress-step ${['Out for delivery', 'Delivered'].includes(trackingOrder.status) ? 'completed' : ''}`}>
                  <div className="step-icon">2</div>
                  <div className="step-text">Out for Delivery</div>
                </div>
                <div className={`progress-step ${trackingOrder.status === 'Delivered' ? 'completed' : ''}`}>
                  <div className="step-icon">3</div>
                  <div className="step-text">Delivered</div>
                </div>
              </div>

              <div className="order-items">
                <h4>Items:</h4>
                {trackingOrder.items.map((item, index) => (
                  <p key={index}>
                    <span 
                      className="dish-name-link" 
                      onClick={() => handleDishClick(item.name)}
                      title={`Click to view ${item.name}`}
                    >
                      {item.name}
                    </span>
                    <span> x {item.quantity}</span>
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyOrders
