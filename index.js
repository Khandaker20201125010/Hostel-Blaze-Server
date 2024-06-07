const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const { MongoClient, ObjectId, ServerApiVersion } = require('mongodb');

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.texsw4y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    const mealsCollection = client.db("Hostel").collection("meals");
    const reviewCollection = client.db("Hostel").collection("reviews");
    const userCollection = client.db("Hostel").collection("users");
    const cartCollection = client.db("Hostel").collection("carts");

    app.get('/meals', async (req, res) => {
      const result = await mealsCollection.find().toArray();
      res.send(result);
    });
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.get('/carts', async (req, res) => {
      const email =req.query.email;
      const query = {email:email};
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });
    app.post('/carts', async (req, res) => {
      const cartsItem = req.body;
      const result = await cartCollection.insertOne(cartsItem);
      res.send(result);
    });

    app.get('/meals/:id', async (req, res) => {
      const id = req.params.id; 
      const query = { _id: new ObjectId(id) };
      const result = await mealsCollection.findOne(query);
      res.send(result);
    });

    app.post('/meals', async (req, res) => {
      const addFood = req.body;
      const result = await mealsCollection.insertOne(addFood);
      res.send(result);
    });
  
    app.post('/users', async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    

    app.patch('/meals/uptodate/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedFood = req.body;
      const food = {
        $set: {
          title: updatedFood.title,
          like: updatedFood.like,
          description: updatedFood.description,
          price: updatedFood.price,
          category: updatedFood.category,
          adminName: updatedFood.adminName,
          mealImage: updatedFood.mealImage,
          isSold: updatedFood.isSold,
          buyersEmail: updatedFood.buyersEmail,
          time: updatedFood.time
        }
      };
      const result = await mealsCollection.updateOne(filter, food);
      res.send(result);
    });

    app.get('/reviews', async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Hostel is processing');
});

app.listen(port, () => {
  console.log(`Hostel is running on ${port}`);
});
  