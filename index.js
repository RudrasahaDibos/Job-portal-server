const express = require('express');
const app = express()
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const port = process.env.PORT || 5000
// middleman 
app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.SECRET_USER}:${process.env.SECRET_PASS}@cluster0.1z9vn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    await client.connect();
     
    const JobsCollections = client.db("jobs-portal").collection("jobs");
    const JobsApplicationCollections = client.db("jobs-portal").collection("jobs-applications");


    app.get('/jobs',async(req,res)=>{
        const email = req.query.email;
        let query ={};
        if(email){
          query={hr_email:email}
        }
        const Cursor =  JobsCollections.find(query)
        const result = await Cursor.toArray()
        res.send(result)
    })
    app.get('/jobs/:id',async(req,res)=>{
        const id = req.params.id
        const query = {_id: new ObjectId(id)}
        const result = await JobsCollections.findOne(query)
        res.send(result)
    })
    app.post('/jobs',async(req,res)=>{
      const job   = req.body;
      const result = await JobsCollections.insertOne(job)
      res.send(result)
    })

    // job applications 


    app.get('/jobs-applications',async(req,res)=>{
      const email = req.query.email;
      const query = {applicant_email:email}
      const result = await JobsApplicationCollections.find(query).toArray()
      //forika way
      for (const application of result) {
         console.log(application.job_id)
        //  job id diye job inforamiton 
        const query1 = {_id:new ObjectId(application.job_id)}
        const job = await JobsCollections.findOne(query1)
        if(job){
          application.title = job.title;
          application.company = job.company,
          application.company_logo = job.company_logo
        }
      }
      res.send(result)
    })

    app.post('/jobs-applications',async(req,res)=>{
      const application = req.body;
      const result = await JobsApplicationCollections.insertOne(application)
      const id = application.job_id
      const query = {_id:new ObjectId(id)}
      const job = await JobsCollections.findOne(query)
      let newCount = 0;
      if(job.applicationCount){
        newCount = job.applicationCount+1
      }
      else{
        newCount = 1
      }
      const filter = {_id: new ObjectId(id)}
      const updateDoc ={
        $set:{
          applicationCount:newCount
        }
      }
      const updateresult = await JobsCollections.updateOne(filter,updateDoc)
     
      res.send(result)
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






app.get('/', (req, res) => {
    res.send('Hello World!')
  })
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })