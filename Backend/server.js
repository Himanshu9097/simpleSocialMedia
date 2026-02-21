require('dotenv').config();
const app = require("./src/app");
const connectDB = require("./src/db/db");


const http = require('http');
const { initSocket } = require('./src/socket');

connectDB();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, ()=>{
    console.log(`Server is running at port no ${PORT}`);
});