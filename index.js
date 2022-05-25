//basic formations
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
require("dotenv").config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

//middleware
app.use(cors())
app.use(express.json())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.go7gn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


const verifyJWT=(req, res, next)=>{
  const authHeader =req.headers.authorization;
  if(!authHeader){
    return res
    .status(401)
    .send({message: "UnAuthorized access"});
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
    if(err){
      return res.status(403).send({message: "Forbidden access"})
    }
    req.decoded = decoded;
    next()
  })
}


async function run() {
    try{
        await client.connect()
        const partsCollection = client.db("cavalryparts").collection("parts");
        const userCollection = client.db("cavalryparts").collection("user");
        const orderCollection = client.db("cavalryparts").collection("order");
        const reviewCollection = client.db("cavalryparts").collection("review");

        //get all parts
        app.get('/parts', async(req, res)=>{
            const parts = await partsCollection.find({}).toArray();
            res.send(parts)
        })

        //get single parts
        app.get('/parts/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id:ObjectId(id)}
            const result = await partsCollection.findOne(query);
            res.send(result)
        })
    
    // get all users
    app.get('/user',verifyJWT, async(req, res)=>{
      const result = await userCollection.find({}).toArray();
      res.send(result)
    })

    // get single user
    // app.get('/user/:email', async(req, res)=>{
    //   const email = req.params.email;
    //   const query = {email: email}
    //   const result = await userCollection.findOne(query)
    //   res.send(result)
    // })

    // //update user
    app.patch('/user/:id', verifyJWT, async(req, res)=>{
      const id = req.params.id;
      const filter = {_id: ObjectId(id)};
      const updatedDoc ={
        $set:{

        }
      }
      const result = await userCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })
   
    // users by email and issue jwt
    app.put("/user/:email", async (req, res) => {
        const user = req.body;
        const email = req.params.email;
        const filter = { email: email };
        const option = { upsert: true };
        const updatedDoc = {
          $set: user,
        };
        const result = await userCollection.updateOne(filter, updatedDoc, option);
        const token = jwt.sign({email:email}, process.env.ACCESS_TOKEN_SECRET, {expiresIn : '1h'})
        res.send({result, token});
      });

      // create order
      app.post('/order', async(req, res)=>{
        const order = req.body;
        const result = await orderCollection.insertOne(order);
        res.send(result)
      })

      // get my order
      app.get('/order',verifyJWT, async(req, res)=>{
        const email = req.query.email;
        const decodedEmail = req.decoded.email;
        if(email === decodedEmail){
          const query = {email: email};
        const result = await orderCollection.find(query).toArray();
        res.send(result)
        }else{
          return res.status(403).send({message: "Forbidden access"})
        }
        
      })

      // delete order
      app.delete('/order/:id', verifyJWT, async(req, res)=>{
        const id = req.params.id;
        const query = {_id: ObjectId(id)};
        const result = await orderCollection.deleteOne(query)
        res.send(result)
      })

      //get single order
      app.get('/order/:id',verifyJWT, async(req, res)=>{
        const id = req.params.id;
        const query = {_id:ObjectId(id)}
        const result = await orderCollection.findOne(query)
        res.send(result)
      })

      // add product
      app.post('/parts', async(req, res)=>{
        const product = req.body;
        const result = await partsCollection.insertOne(product);
        res.send(result)
      })

      // get all review
      app.get('/review', async(req, res)=>{
        const result = await reviewCollection.find({}).toArray()
        res.send(result)
      })

      // Create review
      app.post('/review', async(req, res)=>{
        const review = req.body;
        const result = await reviewCollection.insertOne(review);
        res.send(result)
      })

       //make admin
       app.put('/user/admin/:email', verifyJWT, async(req, res)=>{
         const email = req.params.email;
         const requester = req.decoded.email;
         const requesterAccount = await userCollection.findOne({email: requester})
         if(requesterAccount.role === 'admin'){
           const filter = {email: email}
           const updatedDoc = {
             $set: {role: 'admin'}
           };
           const result = await userCollection.updateOne(filter, updatedDoc);
           res.send(result);
         }else{
           res.status(403).send({message: "forbidden acces"})
         }
       })

    // Check Admin
    app.get('/admin/:email', verifyJWT, async(req, res)=>{
      const email = req.params.email;
      const user = await userCollection.findOne({email:email})
      const isAdmin = user.role === 'admin';
      res.send({admin: isAdmin})
    })

    app.post('/create-payment-intent', verifyJWT, async(req, res) =>{
      const order = req.body;
      const price = order?.productPrice;
      const amount = price*100;
      const paymentIntent = await stripe.paymentIntents.create({
        amount : amount,
        currency: 'usd',
        payment_method_types:['card']
      });
      res.send({clientSecret: paymentIntent.client_secret})
    });


    // make payment
    // app.post("/create-payment-intent",verifyJWT, async(req, res)=>{
    //   const order = req.body;
    //   const price = order?.productPrice;
    //   const amount = price*100
    //   const paymentIntent = await stripe.paymentIntents.create({
    //     amount: amount,
    //     currency: "usd",
    //     payment_method_types: ['card'],
    //   });
    //   res.send({clientSecret: paymentIntent.client_secret})
    // })
  

    }finally{

    }
}
run().catch(console.dir);



app.get('/', (req, res)=>{
    res.send('Cavalry-parts server running successfully')
})
app.listen(port,()=>{
    console.log(`server is runnig ${port}`);
})