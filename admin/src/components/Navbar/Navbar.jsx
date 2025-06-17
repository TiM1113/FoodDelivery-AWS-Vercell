// Using rafce shorthand to create react component-Navbar.
// Import CSS into Navbar component
import './Navbar.css'
// Import assets
import { assets } from '../../assets/assets'

const Navbar = () => {
  return (
    <div className='navbar'>
      <img className='logo' src={assets.logo} alt="" />
      <img className='profile' src={assets.profile_image} alt="" />

    </div>
  )
}

export default Navbar
