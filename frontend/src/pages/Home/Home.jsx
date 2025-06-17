import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './Home.css';
import Header from '../../components/Header/Header';
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu';
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay';
import AppDownload from '../../components/AppDownload/AppDownload';

const Home = () => {

    const [category, setCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const location = useLocation();

    // Handle search query from navigation
    useEffect(() => {
        if (location.state?.searchQuery) {
            setSearchQuery(location.state.searchQuery);
            setCategory("All"); // Reset category when searching
            
            // Scroll to food display section
            setTimeout(() => {
                const foodDisplay = document.querySelector('.food-display');
                if (foodDisplay) {
                    foodDisplay.scrollIntoView({ behavior: 'smooth' });
                }
            }, 100);
            
            // Clear the navigation state to prevent re-triggering
            window.history.replaceState({}, document.title);
        }
    }, [location.state]); 

	return (
		<div>
			<Header/>
      <ExploreMenu category={category} setCategory={setCategory}/>
      <FoodDisplay category={category} searchQuery={searchQuery} setSearchQuery={setSearchQuery}/>
      <AppDownload/>
		</div>
	);
};

export default Home;
