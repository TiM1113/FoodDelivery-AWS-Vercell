import { useContext, useEffect, useState, useCallback } from 'react'
import './MyOrders.css'
import axios from 'axios'
import { StoreContext } from '../../context/StoreContext';
import { assets, menu_list } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const MyOrders = () => {
  
  const [data,setData] =  useState([]);
  const [trackingOrder, setTrackingOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editOrderItems, setEditOrderItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const {url,token,food_list} = useContext(StoreContext);
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

  const handleTrackOrder = async (order) => {
    // Immediately show the modal with current data for faster response
    setTrackingOrder(order);
    
    // Then fetch latest data in background and update if needed
    try {
      const response = await axios.post(url+"/api/order/userorders",{},{headers:{token}});
      const updatedOrders = response.data.data;
      const updatedOrder = updatedOrders.find(o => o._id === order._id);
      
      // Update modal with fresh data if different
      if (updatedOrder && JSON.stringify(updatedOrder) !== JSON.stringify(order)) {
        setTrackingOrder(updatedOrder);
        // Also update the main orders list
        setData(updatedOrders);
      }
    } catch (error) {
      console.error('Error fetching latest order status:', error);
      // Keep showing the modal with existing data
    }
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
      
      // Mark that we're going to payment
      sessionStorage.setItem('fromPayment', 'true');
      
      // Use the new retry payment endpoint that reuses existing order
      const response = await axios.post(url + "/api/order/retry-payment", { orderId: order._id }, { headers: { token } });
      
      if (response.data.success) {
        const { session_url } = response.data;
        window.location.replace(session_url); // Redirect to Stripe Payment Page
      } else {
        toast.error(response.data.message || 'Payment retry failed');
        sessionStorage.removeItem('fromPayment');
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      toast.error(error.response?.data?.message || 'Failed to retry payment');
      sessionStorage.removeItem('fromPayment');
    }
  };

  const getPaymentStatus = (payment) => {
    if (payment === true) {
      return <span className="payment-status paid">💳 Paid</span>;
    } else {
      return <span className="payment-status unpaid">❌ Unpaid</span>;
    }
  };

  const handleDeleteOrder = async (order) => {
    if (window.confirm(`Are you sure you want to delete order #${data.length - data.indexOf(order)}? This action cannot be undone.`)) {
      try {
        const response = await axios.post(url + "/api/order/delete", { orderId: order._id }, { headers: { token } });
        
        if (response.data.success) {
          // Refresh orders list
          await fetchOrders();
          toast.success('Order deleted successfully');
        } else {
          toast.error(response.data.message || 'Failed to delete order');
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        toast.error(error.response?.data?.message || 'Failed to delete order');
      }
    }
  };

  const handleEditOrder = (order) => {
    setEditingOrder(order);
    setEditOrderItems([...order.items]);
  };

  const closeEditOrder = () => {
    setEditingOrder(null);
    setEditOrderItems([]);
    setSelectedCategory("All");
  };

  const updateItemQuantity = (itemIndex, newQuantity) => {
    const updatedItems = [...editOrderItems];
    if (newQuantity <= 0) {
      updatedItems.splice(itemIndex, 1);
    } else {
      updatedItems[itemIndex].quantity = newQuantity;
    }
    setEditOrderItems(updatedItems);
  };

  const addFoodToOrder = (foodItem) => {
    const existingItemIndex = editOrderItems.findIndex(item => item.name === foodItem.name);
    const updatedItems = [...editOrderItems];
    
    if (existingItemIndex !== -1) {
      updatedItems[existingItemIndex].quantity += 1;
    } else {
      updatedItems.push({
        name: foodItem.name,
        price: foodItem.price,
        quantity: 1,
        image: foodItem.image
      });
    }
    setEditOrderItems(updatedItems);
  };

  const calculateOrderTotal = () => {
    return editOrderItems.reduce((total, item) => total + (item.price * item.quantity), 0) + 2; // +2 for delivery
  };

  const getFilteredFoodList = () => {
    if (selectedCategory === "All") {
      return food_list;
    }
    return food_list.filter(food => food.category === selectedCategory);
  };

  const saveOrderChanges = async () => {
    if (editOrderItems.length === 0) {
      if (window.confirm('All items have been removed. Do you want to delete this entire order?')) {
        await handleDeleteOrder(editingOrder);
        closeEditOrder();
      }
      return;
    }

    try {
      const response = await axios.post(url + "/api/order/edit", {
        orderId: editingOrder._id,
        items: editOrderItems,
        amount: calculateOrderTotal()
      }, { headers: { token } });

      if (response.data.success) {
        await fetchOrders(); // Refresh orders list
        closeEditOrder();
        toast.success('Order updated successfully');
      } else {
        toast.error(response.data.message || 'Failed to update order');
      }
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error(error.response?.data?.message || 'Failed to update order');
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
      console.log('MyOrders component mounted, fetching orders...');
      fetchOrders();
      
      // Force component refresh if we detect potential cache issues
      const urlParams = new URLSearchParams(window.location.search);
      const fromStripe = document.referrer.includes('stripe') || 
                        sessionStorage.getItem('fromPayment') === 'true';
      
      if (fromStripe) {
        console.log('Detected return from payment, forcing data refresh...');
        sessionStorage.removeItem('fromPayment');
        // Small delay to ensure fresh data
        setTimeout(() => {
          fetchOrders();
        }, 100);
      }
    }
  },[token, fetchOrders])

  // Refresh data when user returns to the page (e.g., after payment)
  useEffect(() => {
    const handleFocus = () => {
      if (token) {
        console.log('Window focused, refreshing orders...');
        fetchOrders();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && token) {
        console.log('Page became visible, refreshing orders...');
        fetchOrders();
      }
    };

    // Handle browser back button from external pages (like Stripe)
    const handlePageShow = (event) => {
      if (event.persisted && token) {
        // Page was loaded from bfcache (browser back button)
        console.log('Page loaded from cache, forcing refresh...');
        window.location.reload();
      }
    };

    // Handle popstate for browser navigation
    const handlePopState = () => {
      if (token) {
        console.log('Browser navigation detected, refreshing orders...');
        fetchOrders();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [token, fetchOrders]);

  return (
    <div className='my-orders' data-version="2.0">
      
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
              case 'Payment Pending':
                return <span className="status-indicator payment-pending">💳</span>;
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
                <p>{getStatusIndicator(order.payment ? order.status : 'Payment Pending')} <b>{order.payment ? order.status : 'Payment Pending'}</b></p>
                <div className="order-actions">
                  <button onClick={() => handleTrackOrder(order)}>Track Order</button>
                  {!order.payment && (
                    <>
                      <button 
                        className="edit-order-btn" 
                        onClick={() => handleEditOrder(order)}
                      >
                        Edit Order
                      </button>
                      <button 
                        className="delete-order-btn" 
                        onClick={() => handleDeleteOrder(order)}
                      >
                        Delete Order
                      </button>
                    </>
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
              <button className="close-btn" onClick={closeTracking}>Close</button>
            </div>
            <div className="tracking-details">
              <p><strong>Order ID:</strong> {trackingOrder._id}</p>
              <p><strong>Status:</strong> <span className={`status ${trackingOrder.payment ? trackingOrder.status.toLowerCase().replace(' ', '-') : 'payment-pending'}`}>{trackingOrder.payment ? trackingOrder.status : 'Payment Pending'}</span></p>
              <p><strong>Amount:</strong> ${trackingOrder.amount}.00</p>
              <p><strong>Payment:</strong> {trackingOrder.payment ? 'Paid' : 'Pending'}</p>
              
              {trackingOrder.payment ? (
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
              ) : (
                <div className="payment-reminder">
                  <div className="payment-warning">
                    <h4>⚠️ Payment Required</h4>
                    <p>This order cannot be processed until payment is completed. Please complete your payment to start order preparation.</p>
                    <button 
                      className="retry-payment-btn"
                      onClick={() => {
                        closeTracking();
                        handleRetryPayment(trackingOrder);
                      }}
                    >
                      Complete Payment
                    </button>
                  </div>
                </div>
              )}

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

      {/* Edit Order Modal */}
      {editingOrder && (
        <div className="edit-order-modal">
          <div className="edit-order-content">
            <div className="edit-order-header">
              <h3>Edit Order #{data.length - data.indexOf(editingOrder)}</h3>
              <button className="close-btn" onClick={closeEditOrder}>Close</button>
            </div>
            
            <div className="edit-order-body">
              <div className="current-items">
                <h4>Current Items:</h4>
                {editOrderItems.map((item, index) => (
                  <div key={index} className="edit-item">
                    <span className="item-name">{item.name}</span>
                    <span className="item-price">${item.price}</span>
                    <div className="quantity-controls">
                      <button 
                        onClick={() => updateItemQuantity(index, item.quantity - 1)}
                        className="quantity-btn"
                      >
                        -
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        onClick={() => updateItemQuantity(index, item.quantity + 1)}
                        className="quantity-btn"
                      >
                        +
                      </button>
                    </div>
                    <button 
                      onClick={() => updateItemQuantity(index, 0)}
                      className="remove-item-btn"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                
                {editOrderItems.length === 0 && (
                  <p className="no-items">No items in order</p>
                )}
              </div>

              <div className="add-items">
                <h4>Add More Items:</h4>
                
                {/* Category Navigation */}
                <div className="category-navigation">
                  <button 
                    className={`category-btn ${selectedCategory === "All" ? "active" : ""}`}
                    onClick={() => setSelectedCategory("All")}
                  >
                    All
                  </button>
                  {menu_list.map((category, index) => (
                    <button 
                      key={index}
                      className={`category-btn ${selectedCategory === category.menu_name ? "active" : ""}`}
                      onClick={() => setSelectedCategory(category.menu_name)}
                    >
                      <img src={category.menu_image} alt={category.menu_name} />
                      <span>{category.menu_name}</span>
                    </button>
                  ))}
                </div>

                {/* Food Grid */}
                <div className="food-grid">
                  {getFilteredFoodList().map((food, index) => (
                    <div key={index} className="food-item-add">
                      <img src={food.image} alt={food.name} />
                      <div className="food-info">
                        <p className="food-name">{food.name}</p>
                        <p className="food-price">${food.price}</p>
                        <button 
                          onClick={() => addFoodToOrder(food)}
                          className="add-food-btn"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {getFilteredFoodList().length === 0 && (
                    <p className="no-food-items">No items found in this category</p>
                  )}
                </div>
              </div>

              <div className="order-summary">
                <h4>Order Summary:</h4>
                <p>Items Total: ${editOrderItems.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}</p>
                <p>Delivery: $2.00</p>
                <p><strong>Total: ${calculateOrderTotal().toFixed(2)}</strong></p>
              </div>

              <div className="edit-order-actions">
                <button onClick={saveOrderChanges} className="save-changes-btn">
                  Save Changes
                </button>
                <button onClick={closeEditOrder} className="cancel-edit-btn">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyOrders
