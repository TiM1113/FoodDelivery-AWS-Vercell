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
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [activeTab, setActiveTab] = useState('recent');
  const [favouriteOrders, setFavouriteOrders] = useState([]);
  const [expandedOrders, setExpandedOrders] = useState({});
  const {url,token,food_list,addOrderToCart} = useContext(StoreContext);
  const navigate = useNavigate();

  // Custom confirmation dialog
  const showConfirmDialog = (message, onConfirm) => {
    setConfirmDialog({
      message,
      onConfirm,
      onCancel: () => setConfirmDialog(null)
    });
  };

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
      console.log('Completing payment for existing order:', order._id);
      
      // Mark that we're going to payment from MyOrders
      sessionStorage.setItem('fromPayment', 'retry');
      console.log('🟡 Set fromPayment to retry in MyOrders');
      
      // Create payment session for existing unpaid order
      const response = await axios.post(url + "/api/order/retry-payment", { orderId: order._id }, { headers: { token } });
      
      if (response.data.success) {
        const { session_url } = response.data;
        window.location.replace(session_url); // Redirect to Stripe Payment Page
      } else {
        toast.error(response.data.message || 'Payment failed to start');
        sessionStorage.removeItem('fromPayment');
      }
    } catch (error) {
      console.error('Error starting payment:', error);
      toast.error(error.response?.data?.message || 'Failed to start payment');
      sessionStorage.removeItem('fromPayment');
    }
  };

  const getPaymentStatus = (payment) => {
    if (payment === true) {
      return <span className="payment-status paid">✅ Paid</span>;
    } else {
      return <span className="payment-status unpaid">❌ Unpaid</span>;
    }
  };

  const getDeliveryStatus = (order) => {
    if (!order.payment) {
      return <span className="delivery-status pending">⏳ Payment Pending</span>;
    }
    switch(order.status) {
      case 'Delivered':
        return <span className="delivery-status delivered">📦 Delivered</span>;
      case 'Out for delivery':
        return <span className="delivery-status shipping">🚚 Out for Delivery</span>;
      case 'Food Processing':
        return <span className="delivery-status processing">👨‍🍳 Processing</span>;
      default:
        return <span className="delivery-status default">📋 {order.status}</span>;
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrders(prev => ({
      ...prev,
      [orderId]: !prev[orderId]
    }));
  };

  const toggleFavourite = (order) => {
    setFavouriteOrders(prev => {
      const isFavourite = prev.some(fav => fav._id === order._id);
      if (isFavourite) {
        return prev.filter(fav => fav._id !== order._id);
      } else {
        return [...prev, order];
      }
    });
  };

  const getOrdersToDisplay = () => {
    if (activeTab === 'favourites') {
      return favouriteOrders;
    }
    return data;
  };

  const formatOrderDate = (orderId) => {
    // Extract timestamp from MongoDB ObjectID or use current date
    try {
      const timestamp = parseInt(orderId.substring(0, 8), 16) * 1000;
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return new Date().toLocaleDateString('en-AU', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const handleReorder = async (order) => {
    try {
      const result = await addOrderToCart(order.items);
      
      if (result.success) {
        toast.success(result.message);
        // Navigate to cart page to show the added items
        navigate('/cart');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to add items to cart');
    }
  };

  // Internal function to actually delete the order without confirmation
  const executeDeleteOrder = async (order) => {
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
  };

  const handleDeleteOrder = async (order) => {
    const orderNumber = data.length - data.indexOf(order);
    showConfirmDialog(
      `Are you sure you want to delete order #${orderNumber}? This action cannot be undone.`,
      async () => {
        setConfirmDialog(null);
        await executeDeleteOrder(order);
      }
    );
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
      showConfirmDialog(
        'All items have been removed. Do you want to delete this entire order?',
        async () => {
          setConfirmDialog(null);
          await executeDeleteOrder(editingOrder);
          closeEditOrder();
        }
      );
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


  useEffect(()=>{
    if (token) {
      console.log('MyOrders component mounted, fetching orders...');
      fetchOrders();
      
      // Check if we're coming from payment verification
      const fromVerify = document.referrer.includes('/verify') || 
                        document.referrer.includes('stripe') || 
                        document.referrer.includes('checkout.stripe.com');
      
      if (fromVerify) {
        console.log('Detected return from payment verification, ensuring fresh data...', {referrer: document.referrer});
        // Force immediate data refresh from payment verification
        setTimeout(() => {
          fetchOrders();
        }, 50);
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
    <div className='my-orders' key={`orders-${Date.now()}`} data-version="5.0">
      <h2>My Orders</h2>
      
      {/* Tab Navigation */}
      <div className="order-tabs">
        <button 
          className={`tab-button ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          Recent Orders
        </button>
        <button 
          className={`tab-button ${activeTab === 'favourites' ? 'active' : ''}`}
          onClick={() => setActiveTab('favourites')}
        >
          Favourites
        </button>
      </div>

      <div className="orders-container">
        {getOrdersToDisplay().length === 0 ? (
          <div className="no-orders">
            {activeTab === 'favourites' ? 
              <p>No favourite orders yet. Add some orders to your favourites!</p> :
              <p>No orders found.</p>
            }
          </div>
        ) : (
          getOrdersToDisplay().map((order, index) => {
            const orderNumber = activeTab === 'recent' ? data.length - data.indexOf(order) : index + 1;
            const isExpanded = expandedOrders[order._id];
            const isFavourite = favouriteOrders.some(fav => fav._id === order._id);
            
            return (
              <div key={order._id} className='order-card'>
                <div className="order-card-header">
                  <div className="order-info">
                    <div className="order-image">
                      <img src={assets.parcel_icon} alt="Order" />
                      <span className="order-number">#{orderNumber}</span>
                    </div>
                    <div className="order-details">
                      <h3 className="order-title">
                        {order.items.length === 1 ? 
                          order.items[0].name : 
                          `${order.items[0].name} + ${order.items.length - 1} item${order.items.length > 2 ? 's' : ''}`
                        }
                      </h3>
                      <p className="order-date">{formatOrderDate(order._id)}</p>
                      <button 
                        className="view-details-btn"
                        onClick={() => toggleOrderExpansion(order._id)}
                      >
                        {isExpanded ? 'Hide details ▲' : 'View details ▼'}
                      </button>
                    </div>
                  </div>
                  <div className="order-actions-header">
                    <button 
                      className={`favourite-btn ${isFavourite ? 'active' : ''}`}
                      onClick={() => toggleFavourite(order)}
                      title={isFavourite ? 'Remove from favourites' : 'Add to favourites'}
                    >
                      {isFavourite ? '★' : '☆'}
                    </button>
                    <button 
                      className="reorder-btn"
                      onClick={() => handleReorder(order)}
                    >
                      Reorder
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="order-expanded-details">
                    <div className="order-items-list">
                      <h4>Items:</h4>
                      {order.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="order-item">
                          <span className="item-name">{item.name}</span>
                          <span className="item-quantity">x {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Status Footer */}
                <div className="order-card-footer">
                  <div className="order-status-info">
                    <span className="order-price">${order.amount}.00</span>
                    <span className="order-items-count">Items: {order.items.length}</span>
                    {getPaymentStatus(order.payment)}
                    {getDeliveryStatus(order)}
                  </div>
                  <div className="order-actions">
                    <button className="track-order-btn" onClick={() => handleTrackOrder(order)}>
                      Track Order
                    </button>
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
              </div>
            );
          })
        )}
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

      {/* Custom Confirmation Dialog */}
      {confirmDialog && (
        <div className="confirmation-modal">
          <div className="confirmation-content">
            <div className="confirmation-header">
              <h3>Confirm Action</h3>
            </div>
            <div className="confirmation-body">
              <p>{confirmDialog.message}</p>
            </div>
            <div className="confirmation-actions">
              <button 
                className="confirm-btn"
                onClick={confirmDialog.onConfirm}
              >
                Confirm
              </button>
              <button 
                className="cancel-btn"
                onClick={confirmDialog.onCancel}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyOrders
