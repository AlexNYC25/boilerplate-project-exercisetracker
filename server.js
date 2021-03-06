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
      return res.send({"error": "Error in gathering user data"})
    }
    
    let data = small;
    for(let x = 0; x < data.length; x++){
      let userFiltered = {username: data[x].username, _id: data[x]._id.toString()};
      returnList.push(userFiltered);
    }
    
    
  })
  .then(() => {
    return res.send(returnList);
   
  })
})  

// pass form data: description, duration, and optionaly date use curr date if not passed, response is user object with fields added
app.post('/api/users/:_id/exercises', (req, res) => {
  // date handling 
  let passedDate = req.body.date

  if(passedDate == "" || passedDate == null || typeof passedDate == 'undefined'){
     passedDate = new Date().toDateString();
  }
  else{
    passedDate = new Date(req.body.date).toDateString();
  }

  // checking to see if the required variables were passed to the function
  if(req.body.description){
    if(req.body.duration) {
      if(req.params._id){
        let passedId = req.params._id;
        users.findOneAndUpdate({_id: passedId}, {$push: {exercises: {
          description: req.body.description, 
          duration: parseInt(req.body.duration),
          date: passedDate,
        }}
        }, (err, response) => {
            if(err){
              return res.send(err);
            }
            else{
              res.send({username: response.username, 
                description: req.body.description, 
                duration: parseInt(req.body.duration),
                _id:response._id, 
                date:passedDate})
            }
        })
      }
      else{
        return res.send({error: "User id required"})
      }
    }
    else{
      return res.send({error: "duration required"})
    }
  }
  else{
    return res.send({error: "descroption required"})
  }
  

})



let limitArray = (array, limit) => {
  let arrayLength = array.length;
  if(limit > arrayLength || limit < 0){
    return array;
  }
  return array.slice(0, limit);
}

let filterArrayDateFromTo = (array, fromDate, toDate) => {
  let filteredArray = [];
  for(let x = 0; x < array.length; x++){
    let date = new Date(array[x].date);
    if(date >= fromDate && date <= toDate){
      filteredArray.push(array[x]);
    }
  }
  return filteredArray;
}



// get user object with logs array added with each element having the exercise fields
// has aditition count object that counts how many exercises
// add parameters from to and limit to the request
app.get('/api/users/:_id/logs', (req, res, next) => {
  let passedId = req.params._id;
  let userName = null;
  let userLogs = [];

  let queryFrom = req.query.from;
  let queryLimit = req.query.limit;
  let queryTo = req.query.to;

  users.findOne({_id: passedId}, (err, response) => {
    userName = response.username
    userLogs = response.exercises;


    if(userLogs.length > 0){
      
      if(typeof queryFrom !== 'undefined' && typeof queryTo !== 'undefined'){
        let from = new Date(queryFrom).getTime();
        let to = new Date(queryTo).getTime();
        userLogs = filterArrayDateFromTo(userLogs, from, to);

      }

      if(typeof queryLimit !== 'undefined'){
        userLogs = limitArray(userLogs, queryLimit);
      }

      return res.send({_id:passedId ,username: userName, count: userLogs.length, log: userLogs});
      
    }
    else {
      return res.send({"error": "No logs found"})
    }
  })
  

  
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
