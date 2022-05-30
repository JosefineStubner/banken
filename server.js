import express from "express";
import session from 'express-session';
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from 'bcrypt';

const port = 3000;

const app = express();
const saltRounds = 10;

app.use(express.json());
app.use(express.static('public'));
// app.use(express.urlencoded({ extended: true }));

const client = new MongoClient("mongodb://localhost:27017");
await client.connect();
const db = client.db("bank")
const accountsCollection = db.collection("accounts");
const usersCollection = db.collection("users");

app.use(session({
  resave: false, // don't save session if unmodified
  saveUninitialized: false, // don't create session until something stored
  secret: 'shhhh, very secret',
  cookie: {
    maxAge: 5 * 60 * 1000 // 5 minutes
  }
}));

const restrict = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.status(401).send({ error: 'Unauthorized' });
  }
}

app.post("/register", async (req, res) => {
  const hash = await bcrypt.hash(req.body.pass, saltRounds);

  await usersCollection.insertOne({
    user: req.body.user,
    pass: hash
  });

  res.json({
    success: true,
    user: req.body.user
  });
});

app.post("/login", async (req, res) => {
  const user = await usersCollection.findOne({ user: req.body.user });
  const passMatches = await bcrypt.compare(req.body.pass, user.pass);
  if (user && passMatches) {
    req.session.user = user.user;
    
    res.json({
      user: user.user
    });
  } else { 
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.get('/loggedin', (req, res) => {
  if (req.session.user) {
    res.json({
      user: req.session.user
    });
  } else { 
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({
      loggedin: false
    });
  });
});

//skapa konto
app.post("/accounts", restrict, async (req, res) => {
  const account = {
    name: req.body.name,
    balance: parseInt(req.body.balance)
  };
  await accountsCollection.insertOne(account);
  res.json({
    success: true,
    account
  });
});


//hämta alla konton
app.get("/accounts", restrict, async (req, res) => {
  let accounts = await accountsCollection.find({}).toArray();
  res.json(accounts);
  });

//sätt in pengar på konto

app.put("/accounts/:id/deposit", restrict, async (req, res) => {
  const amount = parseInt(req.body.deposit);

  if (amount <= 0) {
    res.status(400).json({ error: "Ogiltig insättning"});
    return;
  } 

  let account = await accountsCollection.findOne({ _id: ObjectId(req.params.id)});

  account.balance = account.balance + amount;

  await accountsCollection.updateOne({ _id: ObjectId(req.params.id) },
  { $set: account } );
  res.json({
    success: true,
    entry: account
  });
});

//ta ut pengar från konto
app.put("/accounts/:id/withdrawal", restrict, async (req, res) => {
  const amount = parseInt(req.body.withdrawal);

  if (amount <= 0) {
    res.status(400).json({ error: "Ogiltigt uttag"});
    return;
  } 

  let account = await accountsCollection.findOne({ _id: ObjectId(req.params.id)});

  if (amount > account.balance) {
    res.status(400).json({ error: "Du har för lite pengar på kontot för detta uttag"});
    return;
  } 

  account.balance = account.balance - amount;

  await accountsCollection.updateOne({ _id: ObjectId(req.params.id) },
  { $set: account } );
  res.json({
    success: true,
    entry: account
  });
});

//ta bort konto
app.delete("/accounts/:id", restrict, async (req, res) => {
  await accountsCollection.deleteOne({ _id: ObjectId(req.params.id) });
  res.status(204).send();
});


app.listen(port, () => {
  console.log(`Express is listening on port ${port}`);
})