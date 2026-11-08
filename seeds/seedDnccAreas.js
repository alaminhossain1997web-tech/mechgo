
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

const Area = require("../models/Area/areaSchema");
dotenv.config({ path: path.join(__dirname, "../.env") });

const GEOJSON_PATH = path.join(
  __dirname,
  "data",
  "dncc-54-ward-boundaries.geojson"
);

const slugify = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const seedDnccAreas = async () => {
  try {
    const mongoUri =
      process.env.DB_URL || process.env.DB_URL;

    if (!mongoUri) {
      throw new Error("MongoDB connection URI not found in .env");
    }

    if (!fs.existsSync(GEOJSON_PATH)) {
      throw new Error(`GeoJSON file not found: ${GEOJSON_PATH}`);
    }

    await mongoose.connect(mongoUri);

    console.log("MongoDB connected successfully");

    const geojson = JSON.parse(
      fs.readFileSync(GEOJSON_PATH, "utf8")
    );

    if (
      geojson.type !== "FeatureCollection" ||
      !Array.isArray(geojson.features)
    ) {
      throw new Error("Invalid GeoJSON FeatureCollection");
    }

    const features = geojson.features;

    if (features.length !== 54) {
      throw new Error(
        `Expected 54 Ward features, found ${features.length}`
      );
    }

    const cityCorporation = "Dhaka North City Corporation";

    const zoneNumbers = [
      ...new Set(
        features.map((feature) =>
          Number(feature.properties.zoneNo)
        )
      ),
    ].sort((a, b) => a - b);

    const zoneMap = new Map();

    // ---------------------------------
    // STEP 1: Create 10 Zones
    // ---------------------------------

    for (const zoneNo of zoneNumbers) {
      const name = `Zone ${String(zoneNo).padStart(2, "0")}`;
      const slug = slugify(name);

      const zone = await Area.findOneAndUpdate(
        {
          type: "Zone",
          parentAreaId: null,
          slug,
        },
        {
          $set: {
            name,
            slug,
            type: "Zone",
            parentAreaId: null,
            division: "Dhaka",
            district: "Dhaka",
            upazila: "",
            cityCorporation,
            zoneNo,
            wardNo: null,
            isActive: true,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      zoneMap.set(zoneNo, zone._id);

      console.log(`Zone created/updated: ${name}`);
    }

    // ---------------------------------
    // STEP 2: Create 54 Wards
    // ---------------------------------

    const processedWards = new Set();

    for (const feature of features) {
      const properties = feature.properties;
      const geometry = feature.geometry;

      const zoneNo = Number(properties.zoneNo);
      const wardNo = Number(properties.wardNo);

      if (!zoneMap.has(zoneNo)) {
        throw new Error(`Zone ${zoneNo} not found`);
      }

      if (!geometry || !["Polygon", "MultiPolygon"].includes(geometry.type)) {
        throw new Error(`Invalid geometry for Ward ${wardNo}`);
      }

      const wardKey = `${zoneNo}-${wardNo}`;

      if (processedWards.has(wardKey)) {
        throw new Error(`Duplicate Ward: ${wardKey}`);
      }

      processedWards.add(wardKey);

      const name = `Ward ${String(wardNo).padStart(2, "0")}`;
      const slug = slugify(name);

      const ward = await Area.findOneAndUpdate(
        {
          type: "Ward",
          parentAreaId: zoneMap.get(zoneNo),
          slug,
        },
        {
          $set: {
            name,
            slug,
            type: "Ward",
            parentAreaId: zoneMap.get(zoneNo),
            division: "Dhaka",
            district: "Dhaka",
            upazila: "",
            cityCorporation,
            zoneNo,
            wardNo,
            areaSqKm: Number(properties.areaSqKm),
            boundary: geometry,
            isActive: true,
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      console.log(
        `Ward created/updated: ${name} | Zone ${zoneNo} | ${ward._id}`
      );
    }

    // ---------------------------------
    // STEP 3: Verify results
    // ---------------------------------

    const zoneCount = await Area.countDocuments({
      type: "Zone",
      cityCorporation,
    });

    const wardCount = await Area.countDocuments({
      type: "Ward",
      cityCorporation,
    });

    console.log("\n========== SEED SUMMARY ==========");
    console.log("Zones:", zoneCount);
    console.log("Wards:", wardCount);
    console.log("Total:", zoneCount + wardCount);
    console.log("==================================");

    if (zoneCount !== 10 || wardCount !== 54) {
      throw new Error("Seed verification failed");
    }

    console.log("DNCC Area seeding completed successfully!");
  } catch (error) {
    console.error("DNCC Area seeding failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

seedDnccAreas();
