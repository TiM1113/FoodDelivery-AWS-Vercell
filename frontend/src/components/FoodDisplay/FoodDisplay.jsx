import {useContext} from 'react';
import './FoodDisplay.css';

import {StoreContext} from '../../context/StoreContext';
import FoodItem from '../FoodItem/FoodItem';
import PropTypes from 'prop-types';

const FoodDisplay = ({category}) => {
	const {food_list} = useContext(StoreContext);

	// Filter food items based on category
	const filteredFoodList = food_list.filter(item => 
		category === 'All' || category === item.category
	);

	return (
		<div
			className="food-display"
			id="food-display">
			<h2>Top dishes near you</h2>
			<div className="food-display-list">
				{food_list.length === 0 ? (
					<div className="loading-message">
						<p>Loading delicious food items...</p>
					</div>
				) : filteredFoodList.length === 0 ? (
					<div className="no-items-message">
						<p>No items found in this category.</p>
					</div>
				) : (
					filteredFoodList.map((item, index) => (
						<FoodItem
							key={item._id || index}
							id={item._id}
							name={item.name}
							description={item.description}
							price={item.price}
							image={item.image}
						/>
					))
				)}
			</div>
		</div>
	);
};

FoodDisplay.propTypes = {
  category: PropTypes.string.isRequired
};

export default FoodDisplay;
