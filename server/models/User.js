import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    role: {
      type: String,
      enum: ["admin", "instructor", "learner", "parent"],
      default: "learner"
    },
    linkedLearners: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    avatar: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    studentId: { type: String, default: "" },
    sessionVersion: { type: Number, default: 0 }  // incremented on every login — invalidates all old tokens
  },
  { timestamps: true }
);

userSchema.pre("save", async function save(next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = function matchPassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model("User", userSchema);
