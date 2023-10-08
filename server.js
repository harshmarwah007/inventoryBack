
//const MONGO_URL = 'mongodb+srv://harsh:H12345@rest.redsh.mongodb.net/groceryDB?retryWrites=true&w=majority';
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require("cors");
const app = express();
const PORT = 3100;

app.use(bodyParser.json());
app.use(cors());

const MONGO_URL = 'mongodb+srv://harsh:H12345@rest.redsh.mongodb.net/groceryDB?retryWrites=true&w=majority';

const groceryItemSchema = new mongoose.Schema({
  item: { type: String, required: true ,trim:true},
  quantity: { type: Number, required: true, min: 1 },
  expiryDate: { type: Date, required: true },
  unit: { type: String, required: true },
   
  
},{timestamps: true});

const GroceryItem = mongoose.model('GroceryItem', groceryItemSchema);

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1);
  });

app.post('/grocery', async (req, res, next) =>
{
  console.log("Expirey Date",req.body)
  const { item, quantity, expiryDate, unit } = req.body;

  if (!item || !quantity || !expiryDate || !unit) {
    return next(new Error('All fields are required'));
  }

  if (quantity <= 0) {
    return next(new Error('Quantity must be greater than 0'));
  }

  const expiry = new Date(expiryDate);
  if (Object.prototype.toString.call(expiry) !== "[object Date]" ) {
    return next(new Error('Invalid expiry date'));
  }

  try {
    const newItem = new GroceryItem({ item, quantity, expiryDate: expiry, unit });
    await newItem.save();
    res.status(201).json({ message: 'Item added', data: newItem });
  } catch (error) {
    next(new Error('Error adding item'));
  }
});

// GET endpoint to retrieve all grocery items
app.get('/grocery', async (req, res, next) =>
{
  console.log(req.query)
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  try {
    const items = await GroceryItem.find({})
      .sort({createdAt:-1})
      .skip((page - 1) * limit)
      .limit(limit);
    
    const totalItems = await GroceryItem.countDocuments();

    res.status(200).json({
      data: items,
      totalItems: totalItems,
      currentPage: page
    });
  } catch (error) {
    next(new Error('Error fetching items'));
  }
});


app.delete('/grocery/:id', async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new Error('ID is required for deletion'));
  }

  try {
    await GroceryItem.findByIdAndDelete(id);
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    next(new Error('Error deleting item'));
  }
});

app.put('/grocery/:id', async (req, res, next) => {
  const { id } = req.params;
  const { item, quantity, expiryDate, unit } = req.body;
 
  if (!id) {
    return next(new Error('ID is required for updating'));
  }

  if (!item || !quantity || !expiryDate || !unit) {
    return next(new Error('All fields are required'));
  }

  if (quantity <= 0) {
    return next(new Error('Quantity must be greater than 0'));
  }
  
  const expiry = new Date(expiryDate);
  if (Object.prototype.toString.call(expiry) !== "[object Date]" ) {
    return next(new Error('Invalid expiry date'));
  }

try {
    const updatedItem = await GroceryItem.findByIdAndUpdate(id, { item, quantity, expiryDate, unit }, { new: true });
    if (!updatedItem) {
      return next(new Error('Item not found'));
    }
    res.status(200).json({ message: 'Item updated', data: updatedItem });
  } catch (error) {
    next(new Error('Error updating item'));
  }
});

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});
