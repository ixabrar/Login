const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  Conn1:{
    type:String
  },
  Conn2:{
    type:String
  },
  Conn3:{
    type:String
  },
  Conn4:{
    type:String
  }
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = bcrypt.hashSync(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function(plainText, callback) {
  return callback(null, bcrypt.compareSync(plainText, this.password));
};

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
