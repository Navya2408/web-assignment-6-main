const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

let Schema = mongoose.Schema;

let userSchema = new Schema({
  userName: {
    type: String,
    unique: true,
  },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});
let User; // to be defined on new connection (see initialize)
// let Company = mongoose.model("companies", companySchema);

function initialize() {
  return new Promise(function (res, rej) {
    let db = mongoose.createConnection(process.env.MONGODB);

    db.on("error", (err) => {
      rej(err); // reject the promise with the provided error
    });
    db.once("open", () => {
      User = db.model("users", userSchema);
      res();
    });
  });
}

function registerUser(userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
    }

    bcrypt
      .hash(userData.password, 10)
      .then((hash) => {
        userData.password = hash;

        let newUser = new User(userData);

        newUser
          .save()
          .then(() => {
            resolve();
          })
          .catch((err) => {
            if (err.code === 11000) {
              reject("User Name already taken");
            } else {
              reject(`There was an error creating the user: ${err}`);
            }
          });
      })
      .catch((err) => {
        reject("There was an error encrypting the password");
      });
  });
}

function checkUser(userData) {
  return new Promise((resolve, reject) => {
    User.find({ userName: userData.userName })
      .then((users) => {
        if (users.length === 0) {
          reject(`Unable to find user: ${userData.userName}`);
        }

        const user = users[0];

        bcrypt
          .compare(userData.password, user.password)
          .then((result) => {
            if (!result) {
              reject(`Incorrect Password for user: ${userData.userName}`);
            }

            if (user.loginHistory.length === 8) {
              user.loginHistory.pop();
            }

            user.loginHistory.unshift({
              dateTime: new Date().toString(),
              userAgent: userData.userAgent,
            });

            User.updateOne(
              { userName: user.userName },
              { $set: { loginHistory: user.loginHistory } }
            )
              .then(() => {
                resolve(user);
              })
              .catch((err) => {
                reject(`There was an error verifying the user: ${err}`);
              });
          })
          .catch((err) => {
            reject(`There was an error comparing passwords: ${err}`);
          });
      })
      .catch(() => {
        reject(`Unable to find user: ${userData.userName}`);
      });
  });
}

module.exports = {
  initialize,
  checkUser,
  registerUser,
};
