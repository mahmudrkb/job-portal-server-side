const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

//middle ware

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kw4xi.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    const jobCollections = client.db("job-portal").collection("job");
    const jobApplicationCollection = client
      .db("job-portal")
      .collection("jobApplication");

    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      let query = {};
      if (email) {
        query = { hr_email: email };
      }

      const cursor = jobCollections.find(query);
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobCollections.findOne(query);
      res.send(result);
    });
    app.post("/jobs", async (req, res) => {
      const newJob = req.body;
      const result = await jobCollections.insertOne(newJob);
      res.send(result);
    });

    // get application

    app.get("/job-application", async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email };
      const result = await jobApplicationCollection.find(query).toArray();

      //  fokira wayy

      for (const app of result) {
        const query1 = { _id: new ObjectId(app.job_id) };
        const job = await jobCollections.findOne(query1);
        if (job) {
          app.title = job.title;
          app.company = job.company;
          app.company_logo = job.company_logo;
        }
      }
      res.send(result);
    });
    //       const job_ids=result.map(id=>new ObjectId(id.job_id))
    //       const jobs= await jobCollections.find({_id:{$in:job_ids}}).toArray()

    // console.log(job_ids)
    // console.log(jobs)

// view applications
    app.get("/jobs-applications/jobs/:job_id",async(req,res)=>{
      const jobId=req.params.job_id ;
      const query={job_id: jobId}
      const result= await jobApplicationCollection.find(query).toArray()
      res.send(result)
    })

    app.post("/jobs-applications", async (req, res) => {
      const application = req.body;
      const result = await jobApplicationCollection.insertOne(application);
      res.send(result);
    });


    app.patch("/job-applications/:id",async(req,res)=>{
      const id=req.params.id
      const data=req.body
      const filter={_id: new ObjectId(id)}
      const updateDoc={
        $set:{
          status:data.status
        }
      }

      const result= await jobApplicationCollection.updateOne(filter,updateDoc);
      res.send(result)
    })
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("job is falling form the sky");
});
app.listen(port, () => {
  console.log(`"server is running" ${port} `);
});
