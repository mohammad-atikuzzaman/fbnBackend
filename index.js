const express = require("express");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

const uri =
  "mongodb+srv://FBNPabna:FBNPabna@cluster0.cdjmo.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

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
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log(
    //   "Pinged your deployment. You successfully connected to MongoDB!"
    // );

    const db = client.db("FBN");
    const users = db.collection("users");

    app.post("/save-user", async (req, res) => {
      const user = await req.body;
      const result = await users.insertOne(user);
      res.send(result);
    });

    app.get("/akash", async (req, res) => {
      const result = "hello ami akash";
      res.send(result);
    });

    app.get("/donner's", async (req, res) => {
      const result = await users.find().toArray();
      res.send(result);
    });

    app.get("/user-info/:email", async (req, res) => {
      const { email } = req.params;
      const query = { userEmail: email };

      const result = await users.findOne(query);
      res.send(result);
    });

    app.get("/donner-details/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };

      const result = await users.findOne(query);

      const data = await {
        name: result?.userName,
        email: result?.userEmail,
        phone: result?.phone,
        blood: result?.bloodGroup,
        photo: result?.photoUrl,
        village: result?.village,
        lastDonation: result?.lastDonationDate
      };
      res.send(data);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// ____________________________________________________________________

app.get("/", (req, res) => {
  res.send("Hello World! form FBN ( faridpur blood network) server");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
