import { useContext, useState } from 'react'
import './Navbar.css'
import { assets } from '../../assets/assets'
import { Link, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../context/StoreContext';
import PropTypes from 'prop-types';

const Navbar = ({ setShowLogin }) => {

  const [menu, setMenu] = useState("home");
  const [searchQuery, setSearchQuery] = useState("");

  const { getTotalCartAmount, token, setToken } = useContext(StoreContext);
  console.log("Current Token:", token);

  // create navigate function to guide back to home page
  const navigate = useNavigate();

  // this logout function will be executed when click on Logout icon
  const logout = () => {
    localStorage.removeItem("token");
    setToken("");// reset token as empty
    navigate("/");// back to home page
  }

  // Function to handle navigation to home page sections
  const navigateToSection = (sectionId, menuName) => {
    setMenu(menuName);
    
    // If not on home page, navigate to home first
    if (window.location.pathname !== '/') {
      navigate('/');
      // Wait for navigation to complete, then scroll
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      // Already on home page, just scroll
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  // Function to handle search
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Navigate to home page and pass search query
      navigate('/', { state: { searchQuery: searchQuery.trim() } });
      // Keep search query in the search box for user reference
      // setSearchQuery(""); // Removed - let user see what they searched for
    }
  }

  // Handle search on Enter key
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  return (
    <div className='navbar'>
      <Link to='/'><img src={assets.logo} alt="" className="logo" /></Link>
      <ul className="navbar-menu">
        <Link to="/" onClick={() => setMenu("home")} className={menu === "home" ? "active" : ""}>home</Link>
        <a onClick={() => navigateToSection("explore-menu", "menu")} className={menu === "menu" ? "active" : ""}>menu</a>
        <a onClick={() => navigateToSection("app-download", "mobile-app")} className={menu === "mobile-app" ? "active" : ""}>mobile-app</a>
        <a onClick={() => navigateToSection("footer", "contact-us")} className={menu === "contact-us" ? "active" : ""}>contact us</a>
      </ul>
      <div className="navbar-right">
        <div className="navbar-search">
          <input 
            type="text" 
            placeholder="Search food..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="search-input"
          />
          <img src={assets.search_icon} alt="" onClick={handleSearch} className="search-icon" />
        </div>
        <div className="navbar-search-icon">
          <Link to='/cart'><img src={assets.basket_icon} alt="" /></Link>
          <div className={getTotalCartAmount() === 0 ? "" : "dot"}></div>
        </div>
        {!token ? <button onClick={() => setShowLogin(true)}>sign in</button>
          :
          <div className="navbar-profile">
            <img src={assets.profile_icon} alt="" />
            <ul className="nav-profile-dropdown">
              <li onClick={()=>navigate('/myorders')}><img src={assets.bag_icon} alt="" /><p>Orders</p></li>
              <hr />
              <li onClick={logout}><img src={assets.logout_icon} alt="" /><p>Logout</p></li>
            </ul>
          </div>
        }

      </div>
    </div>
  )
}

Navbar.propTypes = {
  setShowLogin: PropTypes.func.isRequired
};

export default Navbar
