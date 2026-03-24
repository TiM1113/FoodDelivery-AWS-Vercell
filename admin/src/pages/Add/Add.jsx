import { useState } from 'react'
import './Add.css';
import { assets } from '../../assets/assets';
import axios from "axios"
import { toast } from 'react-toastify';

const Add = ({ url }) => {

  const [image, setImage] = useState(false);
  const [data, setDate] = useState({
    name: "",
    description: "",
    price: "",
    category: "Salad"
  });
  const [uploading, setUploading] = useState(false);

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!image) {
      toast.error('Image not selected');
      return null;
    }

    setUploading(true);

    try {
      // Step 1: Get presigned URL from backend
      const presignRes = await axios.post(`${url}/api/food/presign`, {
        fileName: image.name,
        contentType: image.type,
      });

      if (!presignRes.data.success) {
        toast.error(presignRes.data.message || 'Failed to get upload URL');
        setUploading(false);
        return;
      }

      const { uploadUrl, key } = presignRes.data;

      // Step 2: Upload image directly to S3
      await fetch(uploadUrl, {
        method: 'PUT',
        body: image,
        headers: { 'Content-Type': image.type },
      });

      // Step 3: Save food item with the S3 key
      const response = await axios.post(`${url}/api/food/add`, {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        category: data.category,
        imageKey: key,
      });

      if (response.data.success) {
        setDate({
          name: "",
          description: "",
          price: "",
          category: "Salad"
        });
        setImage(false);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Error adding food:', error);
      toast.error(error.response?.data?.message || 'Error adding food item');
    } finally {
      setUploading(false);
    }
  }

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setDate(data => ({ ...data, [name]: value }))
  }

  return (
    <div className='add'>
      <form className="flex-col" onSubmit={onSubmitHandler}>
        <div className="add-img-upload flex-col">
          <p>Upload Image</p>
          <input onChange={(e) => { setImage(e.target.files[0]); e.target.value = '' }} type="file" accept="image/*" id="image" hidden />
          <label htmlFor="image">
            <img src={!image ? assets.upload_area : URL.createObjectURL(image)} alt="" />
          </label>

        </div>
        <div className="add-product-name flex-col">
          <p>Product name</p>
          <input onChange={onChangeHandler} value={data.name} type="text" name='name' placeholder='Type here' />
        </div>
        <div className="add-product-description flex-col">
          <p>Product description</p>
          <textarea name='description' onChange={onChangeHandler} value={data.description} type="text" rows={6} placeholder='Write content here' required />
        </div>
        <div className="add-category-price">
          <div className="add-category flex-col">
            <p>Product category</p>
            <select onChange={onChangeHandler} name="category">
              <option value="Salad">Salad</option>
              <option value="Rolls">Rolls</option>
              <option value="Deserts">Deserts</option>
              <option value="Sandwich">Sandwich</option>
              <option value="Cake">Cake</option>
              <option value="Pure Veg">Pure Veg</option>
              <option value="Pasta">Pasta</option>
              <option value="Noodles">Noodles</option>
            </select>
          </div>
          <div className="add-price flex-col">
            <p>Product price</p>
            <input onChange={onChangeHandler} value={data.price} type="Number" name='price' placeholder='25' />
          </div>
        </div>
        <button type="submit" className="add-btn" disabled={uploading}>
          {uploading ? 'Uploading...' : 'ADD'}
        </button>
      </form>
    </div>
  )
}

export default Add
