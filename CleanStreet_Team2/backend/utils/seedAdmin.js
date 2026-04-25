const Admin = require("../models/Admin");

const seedAdmin = async () => {
  try {
    const email = process.env.ADMIN_EMAIL || "admin@cleanstreet.com";
    const password = process.env.ADMIN_PASSWORD || "123456";
    const name = process.env.ADMIN_NAME || "Super Admin";
    const existingAdmin = await Admin.findOne({ email }).select("+password");

    if (!existingAdmin) {
      await Admin.create({
        name,
        email,
        password,
        role: "super_admin",
        isActive: true
      });

      console.log("Admin account created");
    } else {
      existingAdmin.name = existingAdmin.name || name;
      existingAdmin.role = "super_admin";
      existingAdmin.isActive = true;

      const passwordMatches = await existingAdmin.matchPassword(password);
      if (!passwordMatches) {
        existingAdmin.password = password;
      }

      await existingAdmin.save();
      console.log("Admin account ready");
    }

  } catch (error) {
    console.error("Admin seed error:", error);
  }
};

module.exports = seedAdmin;
