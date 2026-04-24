const Admin = require("../models/Admin");

const seedAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({
      email: "admin@cleanstreet.com"
    });

    if (!existingAdmin) {
      await Admin.create({
        name: "Super Admin",
        email: "admin@cleanstreet.com",
        password: "123456"
      });

      console.log("Admin account created");
    } else {
      console.log("Admin already exists");
    }

  } catch (error) {
    console.error("Admin seed error:", error);
  }
};

module.exports = seedAdmin;