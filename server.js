const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')

require('dotenv').config()

const userName = process.env.MONGO_USERNAME;
const password = process.env.MONGO_PASSWORD;


const URL = "mongodb+srv://"+userName+":"+password+"@cluster0.vrici.mongodb.net/Mechanical_switches?retryWrites=true&w=majority";

// connect to database
mongoose.connect(URL, {useNewUrlParser: true, useUnifiedTopology: true})
  .then((result) => {
    console.log("connected to database");
  })
  .catch((err) => {
    console.log("There was some sort of error in connecting to the database");
    console.log(err)
  })

const users = require('./models/users.js')
const e = require('express')

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



let getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min)) + min;
}

// pass form data : username, return obj with username and _id
app.post('/api/users', (req, res) => {
  let username = req.body.username;
  let id = getRandomInt(100000, 999999).toString();

  users.create({_id: id, username: username}, (err, small) => {
    if(err){
      res.send({"error": "error inserting new user"});
    }
    else{
      res.send({username: small.username, _id: small._id});
    }
    
  })

})

// get an arr of all users, each ele is username and _id
app.get('/api/users', (req, res) => {
  let returnList = [];
  users.find({}, (err, small) => {
    if(err){
      res.send({"error": "Error in gathering user data"})
    }
    
    let data = small;
    for(let x = 0; x < data.length; x++){
      let userFiltered = {username: data[x].username, _id: data[x]._id.toString()};
      returnList.push(userFiltered);
    }
    
    
  })
  .then(() => {
    res.send(returnList);
    return;
  })
})  

// pass form data: description, duration, and optionaly date use curr date if not passed, response is user object with fields added
app.post('/api/users/:_id/exercises', (req, res) => {
  let passedId = req.params._id;
  let passedDescription = req.body.description;
  let passedDuration = req.body.duration;
  let passedDate = req.body.date || new Date().toISOString();
  
  let exerciseObject = {description: passedDescription, duration: passedDuration, date: passedDate}

  users.update({_id: passedId}, {$push: {exercises: exerciseObject}}, (err, response) => {
    
    // handle based on modified number
    if(response.nModified === 1){
      users.find({_id: passedId}, (err, response) => {
        
        res.send(response[0])
        return;
      })
    }
    else{
      res.send({error: "User not found"})
    }
    
  })

})

// get user object with logs array added with each element having the exercise fields
// has aditition count object that counts how many exercises
// add parameters from to and limit to the request
app.get('/api/users/:_id/logs', (req, res, next) => {
  let passedId = req.params._id;
  let userDoc = {}
  users.findOne({_id: passedId}, (err, small) => {
    userDoc = small
  })
  .then(() => {
    if(userDoc !== null){
      userDoc = {...userDoc._doc, ...{count: userDoc.exercises.length}}
    }
    
  })
  .finally(() => {
    console.log(userDoc)
    if(userDoc === null){
      res.send({error: "No user found"})
    }
    else{
      res.send(userDoc)
    }
    

  })

  
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
