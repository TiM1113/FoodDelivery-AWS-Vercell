import React, { useEffect, useState } from 'react'
import './List.css'
import axios from 'axios'
import { toast } from "react-toastify"
import PropTypes from 'prop-types'

const List = ({ url }) => {
  const [list, setList] = useState([]);

  const fetchList = async () => {
    try {
      const response = await axios.get(`${url}/api/food/list`);
      if (response.data.success) {
        setList(response.data.data);
      } else {
        toast.error("Error loading food items");
      }
    } catch (error) {
      console.error('Error fetching list:', error);
      toast.error("Error connecting to server");
    }
  }

  const removeFood = async (foodId) => {
    try {
      const response = await axios.post(`${url}/api/food/remove`, { id: foodId })
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList();
      } else {
        toast.error("Error deleting item");
      }
    } catch (error) {
      console.error('Error removing food:', error);
      toast.error("Error connecting to server");
    }
  }

  useEffect(() => {
    fetchList();
  }, [])

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
        {list.map((item) => {
          return (
            <div key={item._id} className="list-table-format">
              <img src={item.image} alt={item.name} />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>${item.price}</p>
              <p onClick={() => removeFood(item._id)} className='cursor'>X</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

List.propTypes = {
  url: PropTypes.string.isRequired,
}

export default List
