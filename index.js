const express = require("express");
const app = express();
require("dotenv").config();
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
const cors = require("cors");
const cookieParser = require("cookie-parser");

// middleware
app.use(cookieParser());
app.use(express.json());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
     "http://localhost:4173",
     "https://testhalal-2a0b9.web.app",
     "https://testhalal-2a0b9.firebaseapp.com",
     "https://rhetorical-harbor.surge.sh"
    ],
    credentials: true,
  })
);

// JWT Middleware
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res
      .status(401)
      .send({ message: "No token provided" });
  }
  jwt.verify(token, process.env.SECRET, function (err, decoded) {
    //err
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "Invalid token" });
    }
    //decoded
    req.user = decoded;
    next();
  });
};

// Mongodb server code

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PASSWORD}@cluster0.eykzqz7.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
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
    app.get("/top6foods", async (req, res) => {
      const cursor = dataCollection.find().sort({ orderNumber: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });
    // Get available food data from the database
    app.get("/availablefoods", async (req, res) => {
      const cursor = dataCollection.find().sort({ quantity: -1 }).limit(8);
      const result = await cursor.toArray();
      res.send(result);
    });

    // Get  food data from the database
    app.get("/foods", async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await dataCollection
        .find()
        .sort({ _id: -1 })
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });

    // Get food data filtering the email
    app.get("/dashboard/foods/:email",verifyToken, async (req, res) => {
      // if(req.params.email != req.user.email) {
      //   return res.status(403).send({ message: "Forbident access!!!" });
      //  }
      const email = req.params.email;
      const query = { addBy: email };
      const result = await dataCollection
        .find(query)
        .sort({ _id: -1 })
        .toArray();
      res.send(result);
    });

    // Get the search food from the database
    app.get("/foods/search", async (req, res) => {
      const searchName = req.query.query;
      const results = await dataCollection
        .find({ name: { $regex: searchName, $options: "i" } })
        .toArray();
      res.send(results);
    });

    // get the total number of items
    app.get("/totalItems", async (req, res) => {
      const count = await dataCollection.estimatedDocumentCount();
      res.send({ count });
    });

    // get single food by id
    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const quary = { _id: new ObjectId(id) };
      const result = await dataCollection.findOne(quary);
      res.send(result);
    });

    // Update user information to database
    app.put("/user/:email", async (req, res) => {
      const userEmail = req.params.email;
      const filter = { email: userEmail };
      const data = req.body;
      const updatedDoc = {
        $set: {
          name: data.name,
          email: data.email,
          photo: data.photo,
        },
      };
      // console.log(updatedDoc)
      const options = { upsert: true };
      const result = await userCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
// Get user data from database
    app.get("/user/:email",verifyToken, async (req, res) => {
      // if(req.params.email != req.user.email) {
      //   return res.status(403).send({ message: "Forbident access!!!" });
      //  }
      const userEmail = req.params.email;
      const quary = { email : userEmail };
      const result = await userCollection.findOne(quary);
      res.send(result);
    });





    // Update Food information to database
    app.put("/foods/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const data = req.body;
      const updatedDoc = {
        $set: {
          quantity: data.quantity,
          orderNumber: data.orderNumber,
          name: data.name,
          image: data.image,
          category: data.category,
          price: data.price,
          origine: data.origine,
          shortDescription: data.shortDescription,
          details: data.details,
        },
      };
      const options = { upsert: true };
      const result = await dataCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    // add a order data to the server
    app.post("/orders", async (req, res) => {
      const data = req.body;
      const result = await orderCollection?.insertOne(data);
      res.send(result);
    });

    // Add a food in the server
    app.post("/addfood", async (req, res) => {
      const foodData = req.body;
      console.log(foodData);
      const result = await dataCollection?.insertOne(foodData);
      res.send(result);
    });

    // delete item of cliend from server
    app.delete("/food/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await dataCollection.deleteOne(query);
      res.send(result);
    });

    // get the order info from the database
    app.get("/order/:email",verifyToken, async (req, res) => {
    //  if(req.params.email != req.user.email) {
    //   return res.status(403).send({ message: "Forbident access!!!" });
    //  }
      const email = req.params.email;
      const query = { orderdemail: email };
      const result = await orderCollection
        .find(query)
        .sort({ _id: -1 })
        .toArray();
      res.send(result);
    });

    // Delete a order history
    app.delete("/order/:id",verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.send(result);
    });

    // JWT
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET, { expiresIn: "24h" });
      // const expirationDate = new Date();
      // expirationDate.setDate(expirationDate.getDate() + 7);
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: true,
          sameSite: "none",
          // expires: expirationDate,
        })
        .send({ msg: "Succeed" });
    });


    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Route
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
