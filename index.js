const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const port = process.env.port || 5000;




app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.texsw4y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)


    const mealsCollection = client.db("Hostel").collection("meals");
    const reviewCollection = client.db("Hostel").collection("reviews");

    app.get('/meals', async (req, res) => {
      const result = await mealsCollection.find().toArray();
      res.send(result);
    })
    app.get('/reviews', async (req, res) => {
      const result = await reviewCollection.find().toArray();
      res.send(result);
    })
    app.get('/meals', async (req, res) => {
      const cursor = mealsCollection.find().sort({ "averageCost": -1 });
      const result = await cursor.toArray();
      res.send(result);
    })
    app.post('/meals', async (req, res) => {
      const addFood = req.body;
      console.log(addFood);
      const result = await mealsCollection.insertOne(addFood);
      res.send(result);

    })
    app.patch('/restaurant/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedFood = req.body;
      const food = {
        $set: {
          title: updatedFood.title,
          quantity: updatedFood.quantity,
          borrowedFoods: updatedFood.borrowedFoods,
          description: updatedFood.description,
          price: updatedFood.price,
          Category: updatedFood.category,
          adminName: updatedFood.adminName,
          Image: updatedFood.Image,
          isSold: true,
          buyersEmail: updatedFood.buyersEmail
        }
      }
      const result = await mealsCollection.updateOne(filter, food)
      res.send(result)

    })
    app.patch('/restaurant/uptodate/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedFood = req.body;
      const food = {
        $set: {
       title: updatedFood.title,
          quantity: updatedFood.quantity,
          borrowedFoods: updatedFood.borrowedFoods,
          description: updatedFood.description,
          price: updatedFood.price,
          Category: updatedFood.category,
          adminName: updatedFood.adminName,
          Image: updatedFood.Image,
          isSold: true,
          buyersEmail: updatedFood.buyersEmail,
          time: updatedFood.time
        }
      }
      const result = await mealsCollection.updateOne(filter, food)
      res.send(result)
    })


    app.get("/restaurant/uptodate/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await mealsCollection.findOne(query);
      res.send(result);
    });
    app.get("/restaurant/:email", async (req, res) => {
      console.log(req.params.email);
      const result = await mealsCollection.find({ email: req.params.email }).toArray();
      res.send(result)
    })
    app.get('/restaurant/update/:id', async (req, res) => {
      const cursor = mealsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })



















    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error

  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hostel is processing ')
})

app.listen(port, () => {
  console.log(`Hostel is running on ${port}`);
})