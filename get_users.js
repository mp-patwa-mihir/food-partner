const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: { type: String, select: false },
  role: String,
  isApproved: Boolean,
  isBlocked: Boolean,
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);

async function getOrResetUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const roles = ["CUSTOMER", "PARTNER", "ADMIN"];
    const credentials = [];

    for (const role of roles) {
      // Find one user of this role
      let user = await User.findOne({ role }).select("+password");
      
      if (!user) {
        // Create one if it doesn't exist
        user = await User.create({
          name: `Test ${role}`,
          email: `${role.toLowerCase()}@test.com`,
          password: "password123", // plaintext
          role: role,
          isApproved: true,
          isBlocked: false
        });
        credentials.push({ role, email: user.email, password: "password123", action: "Created" });
      } else {
        // Reset to plaintext password
        user.password = "password123";
        await user.save();
        credentials.push({ role, email: user.email, password: "password123", action: "Reset" });
      }
    }

    require('fs').writeFileSync('users_clean.json', JSON.stringify(credentials, null, 2));
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

getOrResetUsers();
