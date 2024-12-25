const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')

require('dotenv').config();
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const  port = process.env.PORT || 5000;

// middleware

app.use(cors(
  {
    origin:['http://localhost:5173','https://restaurant-management-9fcba.web.app','https://restaurant-management-9fcba.firebaseapp.com','https://restaurant-management-sayeed.surge.sh','https://restaurant-management-sayeed.netlify.app'],
    credentials: true,
  }
))

app.use(express.json())

app.use(cookieParser())


const verifyToken = (req,res,next)=>{
  // console.log('inside verify token middleware')
  const token = req?.cookies?.token
  if(!token){
    return res.status(401).send({message:'UnAuthorized Access'})
  }

  jwt.verify(token,process.env.JWT_SECRET,(error,decoded)=>{
    if(error){
      return res.status(401).send({message:'Un Authorized Access'})
    }
    req.user = decoded;
    // console.log(req.user)
    next()
  })

  
}





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
    // await client.connect();

    const database = client.db("restaurantDB");
    const restaurantCollection = database.collection("restaurant");
    const foodsPurchaseCollection = database.collection('purchase');

     // Auth Related Apis

     app.post('/jwt',async(req,res)=>{
      const user = req.body;
      
      const token = jwt.sign(user,process.env.JWT_SECRET,{expiresIn:'365d'});
      
      res
        .cookie('token',token,{
          httpOnly:true,
          // secure:false,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",



        })
         .send({success:true})
     })


     app.post('/logout',(req,res)=>{
      res
         .clearCookie('token',{
          httpOnly:true,
          // secure:false,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
             })

          .send({success:true})   
     })






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




      app.get('/foods/:id',verifyToken,async(req,res)=>{
        const id = req.params.id;
        // if (!ObjectId.isValid(id)) {
        //   return res.status(400).send({ message: 'Invalid food ID' });
        // }
        // console.log(req.cookies)
       
      const query = {_id:new ObjectId(id)}
      const result = await restaurantCollection.findOne(query);
      res.send(result)
      })

      app.get('/api/foods/top', async (req, res) => {
        const topFoods = await restaurantCollection.find().sort({ purchaseCount: -1 }).limit(6).toArray();
        res.json(topFoods);
      });


      app.get('/api/foods',verifyToken, async (req, res) => {
      
        const userEmail = req.query.email;
        
        // console.log(req.cookies)
        if(req.user.email !== req.query.email){
          return res.status(403).send({message:'forbidden access'})
        }
        
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


    app.get('/purchases',verifyToken,async(req,res)=>{
      const result = await foodsPurchaseCollection.find().toArray();
      
      res.send(result);
    })

    app.get('/api/purchases',verifyToken,async(req,res)=>{
      const userEmail = req.query.email;
      // console.log(req.cookies)
     
     
      if(req.user.email !== req.query.email){
        return res.status(403).send({message:'forbidden access'})
      }
      
      const query = { email: userEmail };
      
      
    const  result = await foodsPurchaseCollection.find(query).toArray();
    

    res.send(result);
    })


    app.delete('/purchases/:id',async(req,res)=>{
      const id = req.params.id;
      // console.log(id)
    
      const query = { _id: new ObjectId(id) }
      const result = await foodsPurchaseCollection.deleteOne(query);
      res.send(result);
})



    app.post('/purchases',async(req,res)=>{
      const purchaseItem = req.body;
      const result = await foodsPurchaseCollection.insertOne(purchaseItem)

      const id = purchaseItem.food_id;
      // console.log(id)
      const query = {_id : new ObjectId(id)}
      const food = await restaurantCollection.findOne(query);
      let newCount = 0;
      if(food.purchaseCount){
        newCount = food.purchaseCount + 1
      }
      else{
        newCount = 1
      }

      const filter = {_id: new ObjectId(id)};
      const updateDoc = {
        $set:{
          purchaseCount:newCount
        }
      }
      const updateResult = await restaurantCollection.updateOne(filter,updateDoc)





      res.send(result)
    })



   








    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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