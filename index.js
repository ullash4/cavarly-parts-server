//basic formations
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient, ServerApiVersion } = require('mongodb');
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

        //get all parts
        app.get('/parts', async(req, res)=>{
            const parts = await partsCollection.find({}).toArray();
            res.send(parts)
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