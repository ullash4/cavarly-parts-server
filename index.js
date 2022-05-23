//basic formations
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");
require("dotenv").config();

//middleware
app.use(cors())
app.use(express.json())





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.go7gn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try{
        await client.connect()
        const partsCollection = client.db("cavalryparts").collection("parts");
        const userCollection = client.db("cavalryparts").collection("user");
        const orderCollection = client.db("cavalryparts").collection("order");

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

          // get users by email
    app.put("/user/:email", async (req, res) => {
        const user = req.body;
        const email = req.params.email;
        const filter = { email: email };
        const option = { upsert: true };
        const updatedDoc = {
          $set: user,
        };
        const result = await userCollection.updateOne(
          filter,
          updatedDoc,
          option
        );
        res.send(result);
      });

      // create order
      app.post('/order', async(req, res)=>{
        const order = req.body;
        const result = await orderCollection.insertOne(order);
        res.send(result)
      })
  

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