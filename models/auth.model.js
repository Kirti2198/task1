const mongoose= require('mongoose');
const crypto=require('crypto');
const { timeStamp } = require('console');

// User Schema
const userSchema= new mongoose.Schema({
  email: {
    type: String,
    trim: true,
    required: true,
    unique: true,
    lowercase: true
  },
  name:{
    type: String,
    trim: true,
    required: true
  },
  hashed_password:{
    /* I will save as hash after encrypt it
     I will build function to encrypt*/
     type: String,
     required: true
  },
  /* salt is a random string of data 
  used to modify a password hash. */
  salt: String,
  role: {
    type: String,
    default: "Normal"
    // We have more type (normal,admin ...)
  },
  resetPasswordLink: {
    date: String,
    default: ""
  }
},{
  timestamps: true
}
);

// Virtual password
userSchema.virtual('password')
     .set(function (password){
      //  set password note you must use normal function not arrow function
      this._password=password
      this.salt= this.makeSalt()
      this.hashed_password=this.encryptPassword(password)
     })
     .get(function(){
       return this._password
     })

// methods
userSchema.methods = {
  authenticate: function(plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },

  encryptPassword: function(password) {
    if (!password) return '';
    try {
      return crypto
        .createHmac('sha1', this.salt)
        .update(password)
        .digest('hex');
    } catch (err) {
      return '';
    }
  },

  makeSalt: function() {
    return Math.round(new Date().valueOf() * Math.random()) + '';
  }
};

module.exports = mongoose.model('User', userSchema);