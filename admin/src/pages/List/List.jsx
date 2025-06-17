import { useEffect, useState } from 'react'
import './List.css'
import axios from 'axios'
import { toast } from "react-toastify"
import PropTypes from 'prop-types'

const List = ({ url }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const s3Url = import.meta.env.VITE_S3_URL || "https://food-delivery-images-bucket.s3.ap-southeast-2.amazonaws.com";

  const fetchList = async () => {
    try {
      setLoading(true);
      console.log('Fetching food list from:', `${url}/api/food/list`);
      
      const response = await axios.get(`${url}/api/food/list`);
      console.log('Response:', response.data);
      
      if (response.data.success) {
        const foodItems = response.data.data.map(item => ({
          ...item,
          image: item.image.startsWith('http') ? item.image : `${s3Url}/${item.image}`
        }));
        setList(foodItems);
        console.log('Food list loaded successfully:', foodItems.length, 'items');
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

  const startEditing = (item) => {
    setEditingId(item._id);
    setEditingData({
      name: item.name,
      category: item.category,
      price: item.price
    });
    setSelectedImage(null);
  }

  const cancelEditing = () => {
    setEditingId(null);
    setEditingData({});
    setSelectedImage(null);
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  }

  const saveEdit = async (itemId) => {
    try {
      const formData = new FormData();
      formData.append('id', itemId);
      formData.append('name', editingData.name);
      formData.append('category', editingData.category);
      formData.append('price', editingData.price);
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await axios.post(`${url}/api/food/update`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        toast.success('Food item updated successfully');
        setEditingId(null);
        setEditingData({});
        setSelectedImage(null);
        await fetchList();
      } else {
        toast.error(response.data.message || "Error updating item");
      }
    } catch (error) {
      console.error('Error updating food:', error);
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
              {editingId === item._id ? (
                <>
                  <div className="edit-image-container">
                    <img 
                      src={selectedImage ? URL.createObjectURL(selectedImage) : item.image} 
                      alt={item.name} 
                      onError={(e) => {
                        console.error('Error loading image:', item.image);
                        e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                      }}
                    />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageSelect}
                      className="image-input"
                    />
                  </div>
                  <input 
                    type="text" 
                    value={editingData.name} 
                    onChange={(e) => setEditingData({...editingData, name: e.target.value})}
                    className="edit-input"
                  />
                  <select 
                    value={editingData.category} 
                    onChange={(e) => setEditingData({...editingData, category: e.target.value})}
                    className="edit-select"
                  >
                    <option value="Salad">Salad</option>
                    <option value="Rolls">Rolls</option>
                    <option value="Deserts">Deserts</option>
                    <option value="Sandwich">Sandwich</option>
                    <option value="Cake">Cake</option>
                    <option value="Pure Veg">Pure Veg</option>
                    <option value="Pasta">Pasta</option>
                    <option value="Noodles">Noodles</option>
                  </select>
                  <input 
                    type="number" 
                    value={editingData.price} 
                    onChange={(e) => setEditingData({...editingData, price: e.target.value})}
                    className="edit-input"
                    step="0.01"
                  />
                  <div className="edit-actions">
                    <button onClick={() => saveEdit(item._id)} className="save-btn">✓</button>
                    <button onClick={cancelEditing} className="cancel-btn">✗</button>
                  </div>
                </>
              ) : (
                <>
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    onError={(e) => {
                      console.error('Error loading image:', item.image);
                      e.target.src = 'https://via.placeholder.com/100x100?text=No+Image';
                    }}
                  />
                  <p>{item.name}</p>
                  <p>{item.category}</p>
                  <p>${item.price}</p>
                  <div className="action-buttons">
                    <button onClick={() => startEditing(item)} className="edit-btn">Edit</button>
                    <button onClick={() => removeFood(item._id)} className="delete-btn">Delete</button>
                  </div>
                </>
              )}
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
