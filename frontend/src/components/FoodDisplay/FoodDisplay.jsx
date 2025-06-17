import {useContext, useEffect} from 'react';
import './FoodDisplay.css';

import {StoreContext} from '../../context/StoreContext';
import FoodItem from '../FoodItem/FoodItem';
import PropTypes from 'prop-types';

const FoodDisplay = ({category, searchQuery, setSearchQuery}) => {
	const {food_list} = useContext(StoreContext);

	// Clear search query after it's been used
	useEffect(() => {
		if (searchQuery) {
			// Clear the search query after a short delay to allow filtering
			const timer = setTimeout(() => {
				setSearchQuery("");
			}, 100);
			return () => clearTimeout(timer);
		}
	}, [searchQuery, setSearchQuery]);

	// Filter food items based on category and search query
	const filteredFoodList = food_list.filter(item => {
		const matchesCategory = category === 'All' || category === item.category;
		const matchesSearch = !searchQuery || 
			item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.category.toLowerCase().includes(searchQuery.toLowerCase());
		
		return matchesCategory && matchesSearch;
	});

	return (
		<div
			className="food-display"
			id="food-display">
			<h2>{searchQuery ? `Search results for "${searchQuery}"` : "Top dishes near you"}</h2>
			<div className="food-display-list">
				{food_list.length === 0 ? (
					<div className="loading-message">
						<p>Loading delicious food items...</p>
					</div>
				) : filteredFoodList.length === 0 ? (
					<div className="no-items-message">
						<p>{searchQuery ? `No items found matching "${searchQuery}".` : "No items found in this category."}</p>
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
  category: PropTypes.string.isRequired,
  searchQuery: PropTypes.string,
  setSearchQuery: PropTypes.func
};

export default FoodDisplay;
