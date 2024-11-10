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
        donationCount: 0,
        photoUrl,
        role: "donner",
      };

      const user = await users.findOne({
        $or: [{ phone }, { userEmail }],
      });
      if (user) {
        return res.status(202).send({ message: "User already exists" });
      }

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

    app.patch("/update-donor/:phone", async (req, res) => {
      const { phone } = req.params;
      const { date } = req.body;

      const filter = { phone: phone };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          lastDonationDate: date,
        },
        $inc: { donationCount: 1 },
      };

      // if (phone) {
      //   const result = await users.findOne({ phone });
      //   console.log(updateDoc);
      //   return console.log(phone, date);
      // }

      const result = await users.updateOne(filter, updateDoc, options);
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
        donationCount: result?.donationCount,
        role: result?.role,
      };
      res.send(data);
    });

    app.post("/blood-request", async (req, res) => {
      const data = req.body;

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
      const query = { _id: new ObjectId(id) };
      const result = await bloodRequest.deleteOne(query);
      res.send(result);
    });

    app.get("/donated", async (req, res) => {
      const result = await successfully.find().toArray();
      res.send(result);
    });

    app.get("/patient-details/:id", async (req, res) => {
      const { id } = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await successfully.findOne(query);
      res.send(result);
    });

    app.get("/count-documents", async (req, res) => {
      try {
        // Count documents in each collection
        const [usersCount, bloodRequestCount, successfullyCount] =
          await Promise.all([
            users.countDocuments(),
            bloodRequest.countDocuments(),
            successfully.countDocuments(),
          ]);

        res.status(200).json({
          donors: usersCount,
          bloodRequest: bloodRequestCount,
          successfully: successfullyCount,
        });
      } catch (error) {
        res.status(500).json({
          message: "Error fetching document counts",
          error: error.message,
        });
      }
    });

    app.patch("/update-role", async (req, res) => {
      const { role, id } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          role: role,
        },
      };

      const options = { upsert: true };
      const result = await users.updateOne(filter, updateDoc, options);
      res.send(result);
    });

    app.get("/admins", async (req, res) => {
      const filter = { role: "admin" };
      const projection = { photoUrl: 1, userName: 1, role: 1, phone: 1 }; // Specify fields to include
      const result = await users.find(filter).project(projection).toArray();

      res.send(result);
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
