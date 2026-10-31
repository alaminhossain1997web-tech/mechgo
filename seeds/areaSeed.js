
const mongoose = require("mongoose");
require("dotenv").config();

const Area = require("../models/Area/areaSchema");

const ADMIN_ID = process.env.SEED_ADMIN_ID;
const MONGO_URI = process.env.DB_URL;

const areaGroups = {
  // Dhaka North City Corporation
  Uttara: [
    "Uttara Sector 1",
    "Uttara Sector 2",
    "Uttara Sector 3",
    "Uttara Sector 4",
    "Uttara Sector 5",
    "Uttara Sector 6",
    "Uttara Sector 7",
    "Uttara Sector 8",
    "Uttara Sector 9",
    "Uttara Sector 10",
    "Uttara Sector 11",
    "Uttara Sector 12",
    "Uttara Sector 13",
    "Uttara Sector 14",
    "Abdullahpur",
    "House Building",
    "Azampur",
    "Airport",
    "Kawla",
    "Ashkona",
    "Dakshinkhan",
    "Uttarkhan",
    "Diabari",
  ],

  Mirpur: [
    "Mirpur 1",
    "Mirpur 2",
    "Mirpur 6",
    "Mirpur 7",
    "Mirpur 10",
    "Mirpur 11",
    "Mirpur 12",
    "Pallabi",
    "Rupnagar",
    "Kazipara",
    "Shewrapara",
    "Senpara Parbata",
    "Kafrul",
    "Ibrahimpur",
    "Vashantek",
    "Kalshi",
    "Baunia",
    "Shah Ali",
    "Pirerbag",
    "Tolarbag",
    "Paikpara",
    "Darus Salam",
    "Gabtoli",
    "Kallyanpur",
  ],

  Gulshan: [
    "Gulshan 1",
    "Gulshan 2",
    "Banani",
    "Baridhara",
    "Baridhara DOHS",
    "Niketan",
    "Mohakhali",
    "Wireless Gate",
    "Karail",
    "Shahjadpur",
    "Nadda",
    "Kalachandpur",
    "Kuril",
    "Khilkhet",
    "Nikunja 1",
    "Nikunja 2",
  ],

  Badda: [
    "North Badda",
    "Middle Badda",
    "South Badda",
    "Merul Badda",
    "Aftabnagar",
    "Rampura",
    "East Rampura",
    "West Rampura",
    "Banasree",
    "Hatirjheel",
    "Ulon",
    "Haji Para",
    "Beraid",
  ],

  Mohammadpur: [
    "Mohammadpur",
    "Adabor",
    "Shyamoli",
    "Lalmatia",
    "Bosila",
    "Rayer Bazar",
    "Katasur",
    "Geneva Camp",
    "Town Hall",
  ],

  Tejgaon: [
    "Tejgaon",
    "Tejgaon Industrial Area",
    "Farmgate",
    "Karwan Bazar",
    "Nakhalpara",
    "Tejturi Bazar",
    "Agargaon",
    "Sher-e-Bangla Nagar",
    "Taltola",
    "Bijoy Sarani",
  ],

  // Dhaka South City Corporation
  Dhanmondi: [
    "Dhanmondi",
    "Kalabagan",
    "Jigatola",
    "Satmasjid Road",
    "Green Road",
    "Elephant Road",
    "New Market",
    "Azimpur",
    "Science Lab",
  ],

  Motijheel: [
    "Motijheel",
    "Paltan",
    "Kakrail",
    "Fakirapool",
    "Shantinagar",
    "Segunbagicha",
    "Bijoynagar",
    "Arambagh",
    "Dilkusha",
    "Naya Paltan",
  ],

  OldDhaka: [
    "Lalbagh",
    "Chawkbazar",
    "Bangshal",
    "Kotwali",
    "Wari",
    "Sutrapur",
    "Gandaria",
    "Narinda",
    "Hazaribagh",
    "Kamrangirchar",
    "Islampur",
    "Sadarghat",
    "Shakhari Bazar",
    "Tanti Bazar",
    "English Road",
  ],

  Khilgaon: [
    "Khilgaon",
    "Malibagh",
    "Chowdhury Para",
    "Goran",
    "Basabo",
    "Sabujbagh",
    "Manda",
    "Mugda",
    "Maniknagar",
    "Shahjahanpur",
    "Tikatuli",
  ],

  Jatrabari: [
    "Jatrabari",
    "Sayedabad",
    "Dhania",
    "Kajla",
    "Shanir Akhra",
    "Rayerbagh",
    "Matuail",
    "Demra",
    "Donia",
    "Jurain",
    "Postogola",
    "Kamalapur",
    "Gopibagh",
    "Dayaganj",
  ],

  //Gazipur 

    Tongi: [
    "Tongi",
    "Tongi Bazar",
    "College Gate",
    "Cherag Ali",
    "Station Road",
    "Mill Gate",
    "Tongi Bridge",
    "Ershad Nagar",
  ],

  Pubail: [
    "Pubail",
    "Pubail Bazar",
    "Harinal",
    "Majukhan",
    "Mirer Bazar",
  ],

  Gacha: [
    "Gacha",
    "Board Bazar",
    "National University",
    "Chandana",
    "Bhadam",
    "Baimail",
  ],

  Gazipur: [
    "Joydebpur",
    "Rajbari",
    "Rajbari Road",
    "Shibbari",
    "Chandana Chowrasta",
    "Gazipur Chowrasta",
  ],

  Kaultia: [
    "Kaultia",
    "Bhadun",
    "Boro Bari",
    "Baria",
    "Mirzapur",
  ],

  Basan: [
    "Basan",
    "Basan Road",
    "Bhogra",
    "Maleker Bari",
    "Signboard",
  ],

  Konabari: [
    "Konabari",
    "Konabari Bazar",
    "Kashimpur Road",
    "Baghia",
    "Jarun",
  ],

  Kashimpur: [
    "Kashimpur",
    "Zirani Bazar",
    "Mouchak Road",
    "Hatimara",
  ],

  Kaliakair: [
    "Kaliakair",
    "Chandra",
    "Mouchak",
    "Safipur",
    "Fulbaria",
    "Boali",
  ],

  Sreepur: [
    "Sreepur",
    "Mawna",
    "Bormi",
    "Telihati",
    "Rajabari",
    "Kewa",
  ],

  Kapasia: [
    "Kapasia",
    "Taragonj",
    "Tok",
    "Barishaba",
    "Ghagotia",
  ],

  Kaliganj: [
    "Kaliganj",
    "Nagari",
    "Tumilia",
    "Jamalpur",
    "Moktarpur",
  ],

  "Gazipur Sadar": [
    "Bhawalgarh",
    "Pirujali",
    "Mirzapur",
    "Baria",
  ],
};

const generateSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const seedAreas = async () => {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing from .env");
    }

    if (!ADMIN_ID || !mongoose.isValidObjectId(ADMIN_ID)) {
      throw new Error("Valid SEED_ADMIN_ID is required in .env");
    }

    await mongoose.connect(MONGO_URI);

    console.log("MongoDB connected successfully.");

    const operations = [];

    for (const [groupName, areaNames] of Object.entries(areaGroups)) {
      for (const name of areaNames) {
        const slug = generateSlug(name);

        operations.push({
          updateOne: {
            filter: { slug },
            update: {
              $setOnInsert: {
                name,
                slug,
                division: "Dhaka",
                district: "Dhaka",
                upazila: groupName,
                isActive: true,
                createdBy: ADMIN_ID,
              },
            },
            upsert: true,
          },
        });
      }
    }

    const result = await Area.bulkWrite(operations, {
      ordered: false,
    });

    console.log("--------------------------------");
    console.log("AREA SEED COMPLETED");
    console.log("Total submitted:", operations.length);
    console.log("Inserted:", result.upsertedCount);
    console.log("Already existed:", result.matchedCount);
    console.log("--------------------------------");
  } catch (error) {
    console.error("AREA SEED ERROR:", error);
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }
};

seedAreas();
