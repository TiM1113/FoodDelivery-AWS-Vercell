// import React, { useContext, useEffect } from 'react'
// import './Verify.css'
// import { useNavigate, useSearchParams } from 'react-router-dom'
// import { StoreContext } from '../../context/StoreContext';
// import axios from 'axios';

// const Verify = () => {

//   const [searchParams, setSearchParams] = useSearchParams();
//   const success = searchParams.get("success");
//   const orderId = searchParams.get("orderId");
//   const { url } = useContext(StoreContext);
//   const navigate = useNavigate();

//   const verifyPayment = async () => {
//     const response = await axios.post(url + "/api/order/verify", { success, orderId });
//     if (response.data.success) {
//       navigate("/myorders");
//     }
//     else {
//       navigate("/")
//     }
//   }

//   // test purpose
//   useEffect(() => {
//     verifyPayment();
//   }, [])




//   return (
//     <div className='verify'>
//       <div className="spinner"></div>
//     </div>
//   )
// }

// export default Verify






import { useContext, useEffect } from 'react';
import './Verify.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import axios from 'axios';

const Verify = () => {
  const [searchParams] = useSearchParams(); // ✅ 确保 searchParams 只读
  const success = searchParams.get("success");
  const orderId = searchParams.get("orderId");
  const source = searchParams.get("source"); // Get payment source from URL
  const { url } = useContext(StoreContext);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔵 Verify component mounted');
    console.log('🔵 URL params - success:', success, 'orderId:', orderId, 'source:', source);
    console.log('🔵 Current sessionStorage fromPayment:', sessionStorage.getItem('fromPayment'));
    
    const verifyPayment = async () => {
      try {
        console.log("🔄 发送 `GET` 请求到:", `${url}/api/order/verify?success=${success}&orderId=${orderId}`);

        const response = await axios.get(`${url}/api/order/verify?success=${success}&orderId=${orderId}`);

        console.log("✅ 响应数据:", response.data);

        if (response.data.success) {
          // Payment successful, always go to orders page to see the updated status
          sessionStorage.removeItem('fromPayment');
          navigate("/myorders");
        } else {
          // Payment failed, determine where to return based on payment source
          const paymentSource = source || sessionStorage.getItem('fromPayment');
          console.log('🔴 Payment failed!');
          console.log('📍 Payment source from URL:', source);
          console.log('📍 Payment source from sessionStorage:', sessionStorage.getItem('fromPayment'));
          console.log('📍 Final payment source used:', paymentSource);
          
          if (paymentSource === 'retry') {
            // This was a retry payment from MyOrders, return to MyOrders
            console.log('✅ Returning to MyOrders (retry payment)');
            sessionStorage.removeItem('fromPayment');
            navigate("/myorders");
          } else {
            // This was a new order from Cart, return to Cart
            console.log('✅ Returning to Cart (new order)');
            sessionStorage.removeItem('fromPayment');
            navigate("/cart");
          }
        }
      } catch (error) {
        console.error("❌ 验证请求失败:", error);
        // On error, determine where to return based on payment source
        const paymentSource = source || sessionStorage.getItem('fromPayment');
        console.log('❌ Error occurred, payment source:', paymentSource);
        
        if (paymentSource === 'retry') {
          sessionStorage.removeItem('fromPayment');
          navigate("/myorders");
        } else {
          sessionStorage.removeItem('fromPayment');
          navigate("/cart");
        }
      }
    };

    // ✅ 只有当 success 和 orderId 存在时才执行请求
    if (success && orderId) {
      verifyPayment();
    } else {
      console.error("⚠️ 缺少 `success` 或 `orderId`，无法发送验证请求");
      // Determine where to return based on payment source
      const paymentSource = source || sessionStorage.getItem('fromPayment');
      console.log('⚠️ Missing success/orderId, payment source:', paymentSource);
      
      if (paymentSource === 'retry') {
        sessionStorage.removeItem('fromPayment');
        navigate("/myorders");
      } else {
        sessionStorage.removeItem('fromPayment');
        navigate("/cart");
      }
    }
  }, [success, orderId, source, url, navigate]); // ✅ 确保 useEffect 只在相关参数变化时触发

  return (
    <div className='verify'>
      <div className="spinner"></div>
    </div>
  );
};

export default Verify;
