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

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_ATTEMPTS = 30; // 60 seconds total

const Verify = () => {
  const [searchParams] = useSearchParams();
  const success = searchParams.get("success"); // only present on cancellation
  const orderId = searchParams.get("orderId");
  const source = searchParams.get("source");
  const { url } = useContext(StoreContext);
  const navigate = useNavigate();

  useEffect(() => {
    const paymentSource = source || sessionStorage.getItem('fromPayment');
    const returnOnFailure = () => {
      sessionStorage.removeItem('fromPayment');
      navigate(paymentSource === 'retry' ? '/myorders' : '/cart');
    };

    // User cancelled payment on Stripe page
    if (success === 'false') {
      axios.get(`${url}/api/order/verify?success=false&orderId=${orderId}`)
        .catch(err => console.error('Cancel order error:', err))
        .finally(returnOnFailure);
      return;
    }

    if (!orderId) {
      returnOnFailure();
      return;
    }

    // Poll for webhook confirmation (Stripe → backend → DB)
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        const response = await axios.get(
          `${url}/api/order/status/${orderId}`,
          { withCredentials: true }
        );
        if (response.data.payment === true) {
          clearInterval(poll);
          sessionStorage.removeItem('fromPayment');
          navigate('/myorders');
        } else if (attempts >= POLL_MAX_ATTEMPTS) {
          clearInterval(poll);
          sessionStorage.removeItem('fromPayment');
          navigate('/myorders');
        }
      } catch (error) {
        console.error('Error polling order status:', error);
        if (attempts >= POLL_MAX_ATTEMPTS) {
          clearInterval(poll);
          returnOnFailure();
        }
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(poll);
  }, [orderId, success, source, url, navigate]);

  return (
    <div className='verify'>
      <div className="spinner"></div>
    </div>
  );
};

export default Verify;
