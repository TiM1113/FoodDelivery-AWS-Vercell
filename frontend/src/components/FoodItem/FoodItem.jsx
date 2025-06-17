import {useContext} from 'react';
import './FoodItem.css';
import {assets} from '../../assets/assets';
import {StoreContext} from '../../context/StoreContext';
import food_1 from '../../assets/food_1.png';
import PropTypes from 'prop-types';

const FoodItem = ({id, name, price, description, image}) => {
	const {cartItems, addToCart, removeFromCart} = useContext(StoreContext);

	return (
		<div className="food-item">
			<div className="food-item-img-container">
				<img
					src={image}
					alt={name}
					className="food-item-image"
					onError={(e) => {
						console.warn('Failed to load image:', image, 'for item:', name);
						e.target.src = food_1;
					}}
				/>
				{!cartItems[id] ? (
					<img
						src={assets.add_icon_white}
						alt=""
						className="add"
						onClick={() => addToCart(id)}
					/>
				) : (
					<div className="food-item-counter">
						<img
							onClick={() => removeFromCart(id)}
							src={assets.remove_icon_red}
							alt=""
						/>
						<p>{cartItems[id]}</p>
						<img
							onClick={() => addToCart(id)}
							src={assets.add_icon_green}
							alt=""
						/>
					</div>
				)}
			</div>
			<div className="food-item-info">
				<div className="food-item-name-rating">
					<p title={name}>{name}</p>
					<img src={assets.rating_starts} alt="" />
				</div>
				<p className="food-item-description">{description}</p>
				<p className="food-item-price">${price}</p>
			</div>
		</div>
	);
};

FoodItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  price: PropTypes.number.isRequired,
  description: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired
};

export default FoodItem;
