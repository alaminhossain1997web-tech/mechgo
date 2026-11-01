
require("dotenv").config();

const mongoose = require("mongoose");
const Area = require("../models/Area/areaSchema");

// Uttara Area Data
const areas = [
  {
    name: "Uttara",
    slug: "uttara",
    division: "Dhaka",
    district: "Dhaka",
    isActive: true,

    boundary: {
      type: "MultiPolygon",
      coordinates: [
        [
          [
            [90.3667713, 23.8924153],
            [90.3672402, 23.8920102],
            [90.3678518, 23.8950085],
            [90.3746133, 23.8935661],
            [90.3768169, 23.8970042],
            [90.3843772, 23.8971255],
            [90.3889194, 23.8902635],
            [90.391299, 23.8821192],
            [90.3933128, 23.8801392],
            [90.3971448, 23.8811168],
            [90.4005505, 23.8816683],
            [90.4032197, 23.8814814],
            [90.4098026, 23.8813846],
            [90.4131493, 23.8825827],
            [90.4165891, 23.8853776],
            [90.421331, 23.8866522],
            [90.4248243, 23.8902523],
            [90.4280254, 23.8924757],
            [90.4330771, 23.8891905],
            [90.4420449, 23.8903031],
            [90.459297, 23.8679829],
            [90.4530592, 23.8572469],
            [90.4396146, 23.8552734],
            [90.4260582, 23.8538919],
            [90.4129403, 23.8509063],
            [90.4064877, 23.8567358],
            [90.4071107, 23.8539181],
            [90.4030541, 23.8556595],
            [90.4005781, 23.856694],
            [90.3982413, 23.8603009],
            [90.3932688, 23.8615463],
            [90.3852714, 23.8568282],
            [90.3877265, 23.8466701],
            [90.366426, 23.8479108],
            [90.3447372, 23.8533126],
            [90.3494969, 23.8597234],
            [90.3506255, 23.8726976],
            [90.3563082, 23.8806988],
            [90.3585069, 23.8827256],
            [90.3600885, 23.8866031],
            [90.36702, 23.8902982],
            [90.3667338, 23.8920648],
            [90.3667713, 23.8924153]
          ]
        ]
      ]
    }
  }
];

const seedAreas = async () => {
  try {
    // Environment validation
    if (!process.env.DB_URL) {
      throw new Error("DB_URL is missing in .env file");
    }

    if (!process.env.SEED_ADMIN_ID) {
      throw new Error("SEED_ADMIN_ID is missing in .env file");
    }

    if (!mongoose.Types.ObjectId.isValid(process.env.SEED_ADMIN_ID)) {
      throw new Error("SEED_ADMIN_ID is not a valid MongoDB ObjectId");
    }

    // Connect MongoDB
    await mongoose.connect(process.env.DB_URL);
    console.log("MongoDB connected successfully");

    const adminId = new mongoose.Types.ObjectId(
      process.env.SEED_ADMIN_ID
    );

    for (const areaData of areas) {
      const area = await Area.findOneAndUpdate(
        { slug: areaData.slug },
        {
          $set: {
            ...areaData,
            createdBy: adminId,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log(`Area seeded successfully: ${area.name}`);
    }

    console.log("All areas seeded successfully");
  } catch (error) {
    console.error("Area seeding failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
};

seedAreas();
