import React, { useEffect, useState } from 'react'
import './List.css'
import axios from 'axios'
import {toast} from "react-toastify"

// add url in List const to destructure it
const List = ({url}) => {

  // const url = "http://localhost:4000"// this url const here should be removed
  // Create one state variable to store all the data form database.
  const [list, setList] = useState([]);





  // Create one fetch list function
  const fetchList = async () => {
    const response = await axios.get(`${url}/api/food/list`);
    // console.log(response.data); don't need this line anymore
    if (response.data.success) {
      setList(response.data.data);
    }
    else{
      toast.error("Error")
    }
  }

  // Create removeFood function for cross 'X' in return p tag and link this function with p tag with X 
  const removeFood = async(foodId) => {
    // console.log used for checking whether link food Id successfully, once successfully linked, it will be delete.
    // console.log(foodId);
    // Then we are going to build the API call, the corresponding food will be deleted
    const response = await axios.post(`${url}/api/food/remove`, {id:foodId})
    await fetchList();
    // also need to add one toast notification to let the user know the item has been deleted
    if ((response.data.success)) {
      toast.success(response.data.message) 
    }
    else {
      toast.error("Error deleting item");
    }
  }







  // useEffect function to test fetchList function
  useEffect(()=>{
    fetchList();
  }, [])

  return (
    // Present database added foods in List page
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
        {list.map((item, index)=>{
          return(
            <div key={index} className="list-table-format">
              <img src={`${url}/images/` + item.image} alt="" />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>item.price</p>
              <p onClick={()=>removeFood(item._id)} className='cursor'>X</p> {/* To be linked with removeFood() function above */}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default List
