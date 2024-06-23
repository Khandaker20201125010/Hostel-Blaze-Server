const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
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
    const upComingMealsCollection = client.db("Hostel").collection("upComingMeals");
    const userCollection = client.db("Hostel").collection("users");
    const cartCollection = client.db("Hostel").collection("carts");
    const membershipCollection = client.db("Hostel").collection("membership");
    const paymentCollection = client.db("Hostel").collection("paymentCollection");
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1hr' });
      res.send({ token });
    });
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' });
        }
        req.decoded = decoded;
        next();
      });
    };
    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    };
    app.get('/users', async (req, res) => {
      try {
        const users = await userCollection.find().toArray();
        res.send(users);
      } catch (error) {
        res.status(500).send({ message: 'Error fetching users', error });
      }
    });
    app.get('/meals', async (req, res) => {
      const result = await mealsCollection.find().toArray();
      res.send(result);
    });

    app.get('/membership', async (req, res) => {
      const result = await membershipCollection.find().toArray();
      res.send(result);
    });

    app.post('/meals', verifyToken, verifyAdmin, async (req, res) => {
      const item = req.body;
      const result = await mealsCollection.insertOne(item);
      res.send(result);
    });
    app.post('/upComingMeals', verifyToken, verifyAdmin, async (req, res) => {
      const item = req.body;
      const result = await upComingMealsCollection.insertOne(item);
      res.send(result);
    });
    app.get('/upComingMeals', async (req, res) => {
      const result = await upComingMealsCollection.find().toArray();
      res.send(result);
    });
    app.get('/users', verifyToken, verifyAdmin, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.get('/users/id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await userCollection.findOne(query);
      res.send(result);
    });

    app.get('/carts', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    });
    app.get('/membership', async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await mealsCollection.find(query).toArray();
      res.send(result);
    });
    app.patch('/users/membership', async (req, res) => {
      const { email, badge, transactionId, date, price } = req.body;
  
      try {
          const filter = { email: email };
          const updateDoc = {
              $set: {
                  badge: badge,
                  transactionId: transactionId,
                  transactionDate: date,
                  price: price
              }
          };
  
          const result = await userCollection.updateOne(filter, updateDoc);
          console.log('Update Result:', result);
  
          if (result.modifiedCount > 0) {
              res.status(200).json({ message: 'Membership updated successfully' });
          } else {
              res.status(400).json({ message: 'Failed to update membership' });
          }
      } catch (error) {
          console.error('Internal Server Error', error);
          res.status(500).json({ message: 'Internal Server Error', error });
      }
  });
  

    app.post('/meals', async (req, res) => {
      const item = req.body;
      const result = await mealsCollection.insertOne(item);
      res.send(result);
    });
    app.delete('/meals/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await mealsCollection.deleteOne(query);
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
    app.post('/meals', verifyToken, verifyAdmin, async (req, res) => {
      const item = req.body;
      // Ensure reviews are stored as an array in MongoDB
      if (!Array.isArray(item.reviews)) {
        item.reviews = [];
      }
      const result = await mealsCollection.insertOne(item);
      res.send(result);
    });



    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await cartCollection.deleteOne(query);
      res.send(result)
    })
    ///payment method
    app.post('/create-payment-intent', async (req, res) => {
      const { price } = req.body;
      const amount = parseInt(price * 100);
      console.log(amount, 'amount inside the intent')

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card']
      });

      res.send({
        clientSecret: paymentIntent.client_secret
      })
    });


    app.patch('/users/badge/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const badge = req.body;
        console.log(badge)
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: { badge: badge }
        };
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        console.error('Error updating user badge:', error);
        res.status(500).send({ error: 'Failed to update user badge' });
      }
    });

    app.post('/users', async (req, res) => {
      const user = req.body;

      const query = { email: user.email }
      const existingUser = await userCollection.findOne(query);
      if (existingUser) {
        return res.send({ message: 'user already exists', insertedId: null })
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    app.patch('/menu/:id', async (req, res) => {
      const item = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) }
      const updatedDoc = {
        $set: {
          title: item.title,
          category: item.category,
          price: item.price,
          ingredients: item.ingredients,
          mealImage: item.mealImage
        }
      }
      const result = await mealsCollection.updateOne(filter, updatedDoc)
      res.send(result);
    })



    app.get('/users/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send(user);
    });
    // app.get('/users/admin/:email', verifyToken, async (req, res) => {
    //   const email = req.params.email;

    //   if (email !== req.decoded.email) {
    //     return res.status(403).send({ message: 'forbidden access' })
    //   }

    //   const query = { email: email };
    //   const user = await userCollection.findOne(query);
    //   let admin = false;
    //   if (user) {
    //     admin = user?.role === 'admin';
    //   }
    //   res.send({ admin });
    // })

    app.get('/users/admin/:email', verifyToken, async (req, res) => {
      const email = req.params.email;

      if (email !== req.decoded.email) {
        return res.status(403).send({ message: 'forbidden access' })
      }

      const query = { email: email };
      const user = await userCollection.findOne(query);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    })

    app.patch('/users/admin/:id', verifyToken, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          role: 'admin'
        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc);
      res.send(result);
    })
    app.patch('/users/sub/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: { subscription: 'subscribed' } // Assuming 'subscription' is the field name in your user schema
      };

      try {
        const result = await userCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to update subscription', error });
      }
    });


    app.patch('/meals/like/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedFood = req.body;
      const likes = {
        $set: {
          title: updatedFood.title,
          likes: updatedFood.likes,
          description: updatedFood.description,
          price: updatedFood.price,
          category: updatedFood.category,
          adminName: updatedFood.adminName,
          mealImage: updatedFood.mealImage,
          email: updatedFood.email,
          rating: updatedFood.rating,
          ingredients: updatedFood.ingredients,
          postTime: updatedFood.postTime,
          reviews: updatedFood.reviews,
          distributorName: updatedFood.distributorName,
          likers: updatedFood.likers
        }
      };
      const result = await mealsCollection.updateOne(filter, likes);
      res.send(result);
    });
    app.get('/meals/like/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await mealsCollection.deleteOne(query);
      res.send(result);

    });
    app.patch('/meals/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedFood = req.body;
      const likes = {
        $set: {
          title: updatedFood.title,
          likes: updatedFood.likes,
          description: updatedFood.description,
          price: updatedFood.price,
          category: updatedFood.category,
          adminName: updatedFood.adminName,
          mealImage: updatedFood.mealImage,
          email: updatedFood.email,
          rating: updatedFood.rating,
          ingredients: updatedFood.ingredients,
          postTime: updatedFood.postTime,
          reviews: updatedFood.reviews,
          distributorName: updatedFood.distributorName,
          likers: updatedFood.likers
        }
      };
      const result = await mealsCollection.updateOne(filter, likes);
      res.send(result);
    });
    app.get('/meals/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await mealsCollection.deleteOne(query);
      res.send(result);

    });

    // app.patch('/meals/reviews/:email', async (req, res) => {
    //   const email = req.params.email;
    //   const query = { email:email };
    //   const result = await mealsCollection.updateOne(query,{$set:(reviews:[])});
    //   res.send(result);

    // });
    //subs

    app.patch('/meals/reviews/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const { reviews } = req.body; // The updated reviews array

      const updateDoc = {
        $set: {
          reviews: reviews
        }
      };

      try {
        const result = await mealsCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to update reviews', error });
      }
    });
    //dta
    app.patch('/meals/reviews/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const { reviews } = req.body;

      const updateDoc = {
        $set: { reviews: reviews }
      };

      try {
        const result = await mealsCollection.updateOne(filter, updateDoc);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: 'Failed to update reviews', error });
      }
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
    app.patch('/meals/newuptodate/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const item = req.body;
      const uptodateDoc = {
        $set: {
          title: item.title,
          category: item.category,
          price: item.price,
          ingredients: item.ingredients,
          mealImage: item.mealImage
        }
      };
      const result = await mealsCollection.updateOne(filter, uptodateDoc);
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
