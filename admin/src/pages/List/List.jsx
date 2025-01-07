import React, { useEffect, useState } from 'react'
import './List.css'
import axios from 'axios'
import { toast } from "react-toastify"
import PropTypes from 'prop-types'

const List = ({ url }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchList = async () => {
    try {
      setLoading(true);
      console.log('Fetching food list from:', `${url}/api/food/list`);
      
      const response = await axios.get(`${url}/api/food/list`);
      console.log('Response:', response.data);
      
      if (response.data.success) {
        setList(response.data.data);
        console.log('Food list loaded successfully:', response.data.data.length, 'items');
      } else {
        console.error('Server returned error:', response.data);
        toast.error(response.data.message || "Error loading food items");
      }
    } catch (error) {
      console.error('Network or server error:', error.message);
      if (error.response) {
        console.error('Error response:', error.response.data);
        toast.error(`Server error: ${error.response.data.message || error.message}`);
      } else if (error.request) {
        console.error('No response received');
        toast.error("No response from server");
      } else {
        console.error('Error details:', error);
        toast.error(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  const removeFood = async (foodId) => {
    try {
      console.log('Removing food item:', foodId);
      const response = await axios.post(`${url}/api/food/remove`, { id: foodId });
      
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList();
      } else {
        console.error('Error removing item:', response.data);
        toast.error(response.data.message || "Error deleting item");
      }
    } catch (error) {
      console.error('Error removing food:', error);
      toast.error(error.response?.data?.message || "Error connecting to server");
    }
  }

  useEffect(() => {
    console.log('List component mounted with URL:', url);
    fetchList();
  }, [url])

  if (loading) {
    return <div className="list add flex-col">Loading food items...</div>;
  }

  return (
    <div className='list add flex-col'>
      <p>All Food List</p>
      <div className="list-table">
        <div className="list-table-format title">
          <b>Image</b>
          <b>Name</b>
          <b>Category</b>
          <b>Price</b>
          <b>Action</b>
        </div>
        {list.length === 0 ? (
          <div className="list-table-format">No food items found</div>
        ) : (
          list.map((item) => (
            <div key={item._id} className="list-table-format">
              <img src={item.image} alt={item.name} />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>${item.price}</p>
              <p onClick={() => removeFood(item._id)} className='cursor'>X</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

List.propTypes = {
  url: PropTypes.string.isRequired,
}

export default List
