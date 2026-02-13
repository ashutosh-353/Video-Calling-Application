import mongoose, { Schema } from "mongoose";

const userScheme = new Schema(
    {
        name: { type: String, required: true },
        username: { type: String, required: true, unique: true },
        password: { type: String, required: false }, // Password not required for Google Auth
        email: { type: String, required: false }, // Store email from Google
        token: { type: String }
    }
)

const User = mongoose.model("User", userScheme);

export { User };