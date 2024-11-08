const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(
  cors({
    origin: "*",
    credentials: true,
  })
);

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
    const bloodRequest = db.collection("bloodRequest");
    const successfully = db.collection("successfully");
    const canceled = db.collection("canceled");

    app.post("/save-user", async (req, res) => {
      const {
        userName,
        userEmail,
        password,
        phone,
        village,
        bloodGroup,
        lastDonationDate,
        photoUrl,
      } = await req.body;

      const data = {
        userName,
        userEmail,
        password,
        phone,
        village,
        bloodGroup,
        lastDonationDate,
        photoUrl,
        role: "donner",
      };
      const result = await users.insertOne(data);
      res.send(result);
    });

    app.get("/donner", async (req, res) => {
      const { village, bloodGroup, userName } = req.query;

      const filter = {};
      if (village) filter.village = village;
      if (bloodGroup) filter.bloodGroup = bloodGroup;
      if (userName) {
        filter.userName = { $regex: userName, $options: "i" };
      }

      const result = await users.find(filter).toArray();
      res.send(result);
    });

    app.get("/villages", async (req, res) => {
      const result = await users.find().toArray();
      const villages = [...new Set(result.map((item) => item.village))];
      res.send(villages);
    });

    app.get("/user-info/:email", async (req, res) => {
      const { email } = req.params;
      const query = { userEmail: email };

      const result = await users.findOne(query);
      res.send(result);
    });

    app.get("/admin/:email", async (req, res) => {
      const { email } = req.params;
      const query = { userEmail: email };

      const result = await users.findOne(query);
      res.send(result?.role);
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
        lastDonation: result?.lastDonationDate,
      };
      res.send(data);
    });

    app.post("/blood-request", async (req, res) => {
      const data = req.body;
      console.log(data);

      const result = await bloodRequest.insertOne(data);
      res.send(result);
    });

    app.get("/request", async (req, res) => {
      const result = await bloodRequest.find().toArray();
      res.send(result);
    });

    app.post("/successful-donation", async (req, res) => {
      const data = req.body;
      const result = await successfully.insertOne(data);
      res.send(result);
    });

    app.delete("/delete-donation/:id", async (req, res) => {
      const { id } = req.params;
      const query = {_id: new ObjectId(id)}
      const result = await bloodRequest.deleteOne(query)
      res.send(result)
    });

    app.get("/donated", async(req, res)=>{
      const result = await successfully.find().toArray()
      res.send(result)
    })
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
