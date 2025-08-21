import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  huggingfaceId: {
    type: String,
    required: true,
    unique: true,
  },
  githubAccessToken: {
    type: String,
    required: true,
  },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
