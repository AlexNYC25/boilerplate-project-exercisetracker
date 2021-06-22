const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    _id : 'Number',
    username: 'String', 
    exercises: [{description: 'String', duration: 'Number', date: 'Date'}]
})

const users = new mongoose.model('Users', userSchema);

module.exports = users;