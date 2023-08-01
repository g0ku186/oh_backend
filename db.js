const mongoose = require('mongoose');

const uri = process.env.db_url;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).catch(e => console.log(e))

const connection = mongoose.connection;
connection.once('open', () => {
  console.log("OH MongoDB database connection established successfully");
});
connection.on('error', err => {
  console.log(err);
});

module.exports = connection;
