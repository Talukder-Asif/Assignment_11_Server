const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

// Mongodb server code 

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@cluster0.eykzqz7.mongodb.net/?retryWrites=true&w=majority`;

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
    // await client.connect();
    const database = client.db("TestHalal");
    const dataCollection = database.collection("ProductData");
    const userCollection = database.collection("UserData");
    const orderCollection = database.collection("OrderData");

    // Get top sell food data from the database
    app.get('/top6foods', async(req, res)=>{
        const cursor = dataCollection.find().sort({ orderNumber: -1 }).limit(6);
        const result = await cursor.toArray();
        res.send(result);
    })
    // Get available food data from the database
    app.get('/availablefoods', async(req, res)=>{
        const cursor = dataCollection.find().sort({ quantity: -1 }).limit(8);
        const result = await cursor.toArray();
        res.send(result);
    })

    // Get  food data from the database
    app.get('/foods', async(req, res)=>{
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
        const result = await dataCollection.find()
        .sort({ _id: -1 })
      .skip(page * size)
      .limit(size)
      .toArray();
      res.send(result);
    })

    // Get food data filtering the email
    app.get('/dashboard/foods/:email', async(req, res)=>{
      const email = req.params.email;
      const query = { addBy: email };
        const result = await dataCollection.find(query)
        .sort({ _id: -1 })
      .toArray();
      res.send(result);
    })

    // Get the search food from the database
    app.get('/foods/search', async (req, res) => {
      const searchName = req.query.query;
        const results = await dataCollection.find({ name: { $regex: searchName, $options: 'i' } }).toArray();
        res.send(results);
    });

    // get the total number of items
    app.get('/totalItems', async(req, res)=>{
      const count = await dataCollection.estimatedDocumentCount();
      res.send({count});
    })


    // get single food by id
    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) };
      const result = await dataCollection.findOne(quary);
      res.send(result);
    });


    // Update user information to database
    app.put('/user/:email', async(req, res)=>{
      const userEmail = req.params.email;
      const filter = {email: userEmail};
      const data = req.body;
      const updatedDoc = {
        $set: {
          name : data.name,
          email : data.email, 
          photo : data.photo,
        },
      };
      // console.log(updatedDoc)
      const options = {upsert: true};
      const result = await userCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    })


    // Update Food information to database
    app.put('/foods/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const data = req.body;
      const updatedDoc = {
        $set: {
          quantity : data.quantity,
          orderNumber : data.orderNumber, 
          name : data.name,
          image : data.image,
          category: data.category,
          price : data.price,
          origine: data.origine,
          shortDescription: data.shortDescription,
          details: data.details,
        },
      };
      const options = {upsert: true};
      const result = await dataCollection.updateOne(filter, updatedDoc, options);
      res.send(result);
    })


    // add a order data to the server
    app.post('/orders', async(req, res)=>{
      const data = req.body;
      const result = await orderCollection?.insertOne(data);
      res.send(result);
    })


    // Add a food in the server
    app.post("/addfood", async (req, res) => {
      const foodData = req.body;
      console.log(foodData)
      const result = await dataCollection?.insertOne(foodData);
      res.send(result);
    });


// delete item of cliend from server
app.delete('/food/:id', async(req, res)=>{
  const id = req.params.id;
  const query = { _id: new ObjectId(id) };
  const result = await dataCollection.deleteOne(query);
  res.send(result);
})



// get the order info from the database
app.get('/order/:email', async (req, res) => {
  const email = req.params.email;
  const query = { orderdemail: email };
  const result = await orderCollection.find(query)
  .sort({ _id: -1 })
  .toArray()
res.send(result);

});

// Delete a order history
app.delete('/order/:id', async(req, res)=>{
  const id = req.params.id;
  const query = {_id : new ObjectId(id)};
  const result = await orderCollection.deleteOne(query);
  res.send(result);
})




    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);





// Route
app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});