const express = require('express')
const app = express();
require('dotenv').config();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const port = process.env.PORT || 5000;

//middle
app.use(cors())
app.use(express.json())



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.User_Name}:${process.env.User_Pass}@cluster0.atafojn.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    // menu database Collection
    const menuCollection = client.db('RestuantServer').collection('Menu');
    // cart collection
    const cartCollection = client.db('CartItem').collection('carts')
    // user collection
    const userCollection = client.db('usrs').collection('user')

    //jwt token
    app.post('/jwt', async(req, res)=>{
       const user=req.body;
       const token= jwt.sign(user, process.env.Access_Token, {
         expiresIn: '1h'
       })
      //  console.log(token)
       res.send({token});
    })
    // --varifyTOken
    const varifyToken=(req,res, next)=>{
      // cheek token
    //  console.log('varify token' , req.headers.authorization)
      if(!req.headers.authorization){
        return res.status(401).send({message: 'forbidden access'})
      }
      const token=req.headers.authorization.split(' ')[1];
      // console.log(token)
      jwt.verify(token, process.env.Access_Token, (err, decoded)=>{
        if(err){
          return res.status(401).send({message: 'forbidden'})
        }
        req.decoded=decoded;
        next();
      })

    }
    // admin user email cheek
    app.get('/user/admin/:email', varifyToken, async(req,res)=>{
      const email= req.params.email;
      if(email !== req.decoded.email){
        return res.status(403).send({message: 'unauthcation user'})
      }
      const query= {email: email};
      const user= await userCollection.findOne(query);
      // 
      let admin=false;
      if(user){
        admin=user?.role==='admin';
      }
      res.send({admin})
    })
    // admin varication
    const varifyAdmin= async(req, res,next)=>{
      const email= req.decoded.email;
      const query= {email: email};
      const user= await userCollection.findOne(query);
      const isAdmin= user?.role==='admin';
      if(!isAdmin){
         return res.status(403).send({message: 'forbidden'})
      }
      next();
    }


    // -----user database-----
    // user get
    app.get('/user',varifyToken,varifyAdmin, async(req, res)=>{
       const result=await userCollection.find().toArray();
       res.send(result);
    })

    // post user
    app.post('/user', async (req, res) => {
      const user = req.body
      //  cheek to user before login
      const email = { email: user.email }
      const existinguser = await userCollection.findOne(email)
      if (existinguser) {
        return res.send({ message: 'user allready exit', insertedId: null })
      }
      const result = await userCollection.insertOne(user)
      res.send(result);
    })
    // update roll
    app.patch('/user/admin/:id',varifyAdmin, async(req, res)=>{
       const id= req.params.id;
       const filter={_id: new ObjectId(id)};
       const updateDoc={
          $set: {
             role: 'admin'
          }
       }
        const result= await userCollection.updateOne( filter, updateDoc);
        res.send(result);
    })

    // user delete
    app.delete('/user/admin/:id',varifyAdmin, async(req, res)=>{
       const id=req.params.id;
       const query= {_id: new ObjectId(id)}
       const result=await userCollection.deleteOne(query);
       res.send(result);
    })


    // --------menu get---------
    app.get('/menu', async (req, res) => {
      const result = await menuCollection.find().toArray();
      res.send(result)
    })

    // ---cart item add start-------
    // get cart item
    app.get('/carts', async (req, res) => {
      // email
      const email = req.query.email;
      const query = { email: email }
      const result = await cartCollection.find(query).toArray();
      res.send(result);
    })

    //post cart
    app.post('/carts', async (req, res) => {
      const cart = req.body;
      //console.log(cart)
      const result = await cartCollection.insertOne(cart);
      res.send(result);
    })
    // delete
    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await cartCollection.deleteOne(query);
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
  res.send('Restuant FullStack Server Start')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})