const express = require('express')
const cors = require('cors')
require('dotenv').config();
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const  port = process.env.PORT || 5000;

// middleware

app.use(cors())

app.use(express.json())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.amvbb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const database = client.db("restaurantDB");
    const restaurantCollection = database.collection("restaurant");
    const foodsPurchaseCollection = database.collection('purchase')



    // Restaurant related apis

    app.get('/foods',async(req,res)=>{
      const search = req.query.search
      
      

      const query = search
      ? {
        itemName: {
            $regex: new RegExp(search, 'i'), 
          },
        }
      : {};


        const cursor = restaurantCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
      })




      app.get('/foods/:id',async(req,res)=>{
        const id = req.params.id;
     
      const query = {_id:new ObjectId(id)}
      const result = await restaurantCollection.findOne(query);
      res.send(result)
      })


      app.get('/api/foods', async (req, res) => {
      
        const userEmail = req.query.email;
        
          const query = { email: userEmail };
        const  result = await restaurantCollection.find(query).toArray();

        res.send(result);
        })


        app.put('/foods/:id',async(req,res)=>{
          const id = req.params.id;
      
          const filter = {_id:new ObjectId(id)}
          const options = { upsert: true };
          const updatedDoc = {
              $set: req.body
          }
    
          const result = await restaurantCollection.updateOne(filter,updatedDoc,options);
          res.send(result)
        })




    app.post('/foods',async(req,res)=>{
        const foodsItem = req.body;
        const result = await restaurantCollection.insertOne(foodsItem)
        res.send(result)
    })



    // purchase related apis


    app.get('/purchases',async(req,res)=>{
      const result = await foodsPurchaseCollection.find().toArray();
      
      res.send(result);
    })




    app.post('/purchases',async(req,res)=>{
      const purchaseItem = req.body;
      const result = await foodsPurchaseCollection.insertOne(purchaseItem)
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


app.get('/',async(req,res)=>{
    res.send('server is working')
})


app.listen(port,()=>{
    console.log(`server is working on port:${port}`)
})