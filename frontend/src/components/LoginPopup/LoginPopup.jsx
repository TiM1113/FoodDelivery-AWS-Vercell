// import React, { useEffect, useState } from 'react' - in this  { useEffect, useState } import, the useEffect function only used for testing state variables, while the verification is finished useEffect function will be delete ad below showed.
import React, { useContext, useState } from 'react'
import './LoginPopup.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'
import axios from "axios"

const LoginPopup = ({ setShowLogin }) => {

  // fetching the URL using the context API
  const { url, setToken } = useContext(StoreContext)

  const [currState, setCurrState] = useState("Login")

  // step 1: create a state variable to link frontend login page to backend user creating and logging functionality in controller.js
  const [data, setData] = useState({
    name: "",
    email: "",
    password: ""
  })

  // step 2: create a change handler and link it to input filed to take data from the user input field and save it in the step 1's state variable
  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({ ...data, [name]: value }))
  }

  // link this function with the form tag
  const onLogin = async (event) => {
    event.preventDefault()
    // using Axios to call the APIs
    let newUrl = url;
    if (currState === "Login") {
      newUrl += "/api/user/login"
    }
    else{
      newUrl += "/api/user/register"
    }

     // call the API will be working in Login and Register
    const response = await axios.post(newUrl, data);

    if (response.data.success) {
      setToken(response.data.token);// Save token to context
      localStorage.setItem("token", response.data.token);// Save token to localStorage
      setShowLogin(false);
    }
    else{
      alert(response.data.message)
    }
  }



  // using useEffect to verify and test this onChangeHandler
  // useEffect(() => {
  //   console.log(data);
  // }, [data])


  return (
    <div className='login-popup'>
      <form onSubmit={ onLogin } className="login-popup-container">
        <div className="login-popup-title">
          <h2>{currState}</h2>
          <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="" />
        </div>
        <div className="login-popup-inputs">
          {/* this input field will be linked with onChangeHandler  in LoginPopup state variable on above */}
          {currState === "Login" ? <></> : <input name='name' onChange={onChangeHandler} value={data.name} type="text" placeholder='Your name' required />}

          <input name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Your email' required />
          <input name='password' onChange={onChangeHandler} value={data.password} type="password" placeholder='Password' required />
        </div>
        <button type='submit'>{currState === "Sign up" ? "Create account" : "Login"}</button>
        <div className="login-popup-condition">
          <input type="checkbox" required />
          <p>By continuing, I agree to the terms of use & privacy policy</p>
        </div>
        {currState === "Login"
          ? <p>Create a new account? <span onClick={() => setCurrState("Sign Up")}>Click here</span></p>
          : <p>Already have an account? <span onClick={() => setCurrState("Login")}>Login here</span></p>}
      </form>
    </div>
  )
}

export default LoginPopup
