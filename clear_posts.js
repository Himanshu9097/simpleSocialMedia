const mongoose = require('mongoose');
const dotenv = require('dotenv');
const postModel = require('./Backend/src/models/post.model');

dotenv.config({ path: './Backend/.env' });

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to DB. Clearing posts...");
    await postModel.deleteMany({});
    console.log("Successfully deleted all posts from the db!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("DB connection error", err);
    process.exit(1);
  });
