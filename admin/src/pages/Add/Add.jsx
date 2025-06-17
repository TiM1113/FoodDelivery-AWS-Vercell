// Using rafce shorthand to create react component-Add.
import { useState } from 'react' // Don't forget to import relative React Hook 'useState' /useEffect hook here just used for testing data update.
// Import CSS into Add component
import './Add.css';
import { assets } from '../../assets/assets';
// Import axios
import axios from "axios"
// 
import { toast } from 'react-toastify';

// add url in Add const to destructure it
const Add = ({ url }) => {

  // const url = "http://localhost:4000"; // this url const here should be removed
  // create state variable(before using 'useState()' should import it in advance)
  const [image, setImage] = useState(false);
  const [data, setDate] = useState({
    name: "",
    description: "",
    price: "",
    category: "Salad" // "Salad" is the default and first option in category
  });



  // // Create(import) useEffect function to check the data whether getting updated / JUST USING FOR TEST DATA
  // useEffect(()=>{
  //   console.log(data);
  // }, [data])
  // // WHEN THE DATA TESTING SUCCESSFUL, WE WILL COMMENT OUT THIS useEffect FUNCTION


  // Create one onsubmit Handler function to do the API call
  const onSubmitHandler = async (event) => {
    event.preventDefault();


    if (!image) {
      TransformStream.error('Image not selected');
      return null;
    }

    const formData = new FormData();
    formData.append("name", data.name)
    formData.append("description", data.description)
    formData.append("price", Number(data.price))
    formData.append("category", data.category)
    formData.append("image", image || "")
    // Call the API we will use axios
    const response = await axios.post(`${url}/api/food/add`, formData);
    if (response.data.success) {
      setDate(
        {
          name: "",
          description: "",
          price: "",
          category: "Salad"
        }
      )
      setImage(false);

      toast.success(response.data.message)// we will get successful message when we upload image successfully
    }
    else {
      toast.error(response.data.message)// we will get failed message when we upload image fail
    }
  }


  // create the on change Handler function, use this function to update category name
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
        <button type="submit" className="add-btn">ADD</button>
      </form>
    </div>
  )
}

export default Add
