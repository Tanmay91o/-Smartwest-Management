import mongoose from "mongoose";
import dns from "node:dns/promises";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

export const connectDB = async () => {
    await mongoose.connect("mongodb+srv://tb802581_db_user:TD3IO9YhUNsfg4Qs@cluster0.n7bwjko.mongodb.net/Smartwest")
        .then(() => console.log("db connected"))
}