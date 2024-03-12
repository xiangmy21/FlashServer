import { MongoClient } from "mongodb";
import dotenv from 'dotenv';
dotenv.config();

const mongo_user = process.env.MONGO_USER;
const mongo_password = process.env.MONGO_PASSWORD;
const uri = `mongodb://${mongo_user}:${mongo_password}@localhost:27017/?authSource=admin`;
const client = new MongoClient(uri);
const database = client.db('FlashServer');
const Users = database.collection('users');
const Orders = database.collection('orders');

export { Users, Orders };