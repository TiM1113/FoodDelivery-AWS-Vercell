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
  const { url } = useContext(StoreContext);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        console.log("🔄 发送 `GET` 请求到:", `${url}/api/order/verify?success=${success}&orderId=${orderId}`);

        const response = await axios.get(`${url}/api/order/verify?success=${success}&orderId=${orderId}`);

        console.log("✅ 响应数据:", response.data);

        if (response.data.success) {
          // Payment successful, clear any payment markers
          sessionStorage.removeItem('fromPayment');
          navigate("/myorders");
        } else {
          // Payment failed, return directly to orders page with fresh data
          console.log('Payment failed, returning to orders page...');
          sessionStorage.removeItem('fromPayment');
          navigate("/myorders");
        }
      } catch (error) {
        console.error("❌ 验证请求失败:", error);
        // Even on error, return to orders page to show current state
        sessionStorage.removeItem('fromPayment');
        navigate("/myorders");
      }
    };

    // ✅ 只有当 success 和 orderId 存在时才执行请求
    if (success && orderId) {
      verifyPayment();
    } else {
      console.error("⚠️ 缺少 `success` 或 `orderId`，无法发送验证请求");
      // Return to orders page instead of home
      sessionStorage.removeItem('fromPayment');
      navigate("/myorders");
    }
  }, [success, orderId, url, navigate]); // ✅ 确保 useEffect 只在相关参数变化时触发

  return (
    <div className='verify'>
      <div className="spinner"></div>
    </div>
  );
};

export default Verify;
