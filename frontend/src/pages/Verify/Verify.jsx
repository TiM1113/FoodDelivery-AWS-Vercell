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






import React, { useContext, useEffect } from 'react';
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
        console.log("🔄 发送 `POST` 请求到:", `${url}/api/order/verify`);
        console.log("📦 请求 Body:", { success, orderId });

        const response = await axios.post(`${url}/api/order/verify`, { success, orderId });

        console.log("✅ 响应数据:", response.data);

        if (response.data.success) {
          navigate("/myorders");
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("❌ 验证请求失败:", error);
        navigate("/");
      }
    };

    // ✅ 只有当 success 和 orderId 存在时才执行请求
    if (success && orderId) {
      verifyPayment();
    } else {
      console.error("⚠️ 缺少 `success` 或 `orderId`，无法发送验证请求");
      navigate("/");
    }
  }, [success, orderId, url, navigate]); // ✅ 确保 useEffect 只在相关参数变化时触发

  return (
    <div className='verify'>
      <div className="spinner"></div>
    </div>
  );
};

export default Verify;
