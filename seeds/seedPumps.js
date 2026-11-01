
const mongoose = require("mongoose");
require("dotenv").config();

const Area = require("../models/Area/areaSchema");
const Pump = require("../models/Pump/pumpSchema");

const ADMIN_ID = process.env.SEED_ADMIN_ID;
const MONGO_URI = process.env.DB_URL;


const pumpData = [
  {
    "name": "Purbachal Filling Station (CNG)",
    "phone": "+880 1921-182689",
    "email": "",
    "address": "Dar-Us-Salam Road, Technical More, Mirpur, Dhaka 1216",
    "description": "24-hour station at Technical More, Mirpur",
    "lat": 23.7820885,
    "lng": 90.3516873,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "Diesel",
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "SP Filling Station",
    "phone": "+880 9606-444777",
    "email": "",
    "address": "Dhaka-Aricha Hwy, Gabtoli, Dhaka",
    "description": "24-hour station near Gabtoli, popular with bikers",
    "lat": 23.7826272,
    "lng": 90.3470198,
    "fuelTypes": [
      "Octane"
    ],
    "facilities": []
  },
  {
    "name": "Sadi Filling Station Ltd",
    "phone": "+880 1318-610797",
    "email": "",
    "address": "Mirpur Rd, Dhaka",
    "description": "24-hour station on Mirpur Rd",
    "lat": 23.8342424,
    "lng": 90.3402711,
    "fuelTypes": [
      "Octane"
    ],
    "facilities": []
  },
  {
    "name": "Mohona Filling Station",
    "phone": "",
    "email": "",
    "address": "Dhaka-Aricha Hwy, Gabtoli, Dhaka",
    "description": "24-hour station near Gabtoli bus terminal",
    "lat": 23.7819034,
    "lng": 90.3504822,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "Diesel"
    ],
    "facilities": []
  },
  {
    "name": "Shahnaz Filling Station & Service Centre Ltd",
    "phone": "+880 1720-267227",
    "email": "",
    "address": "Principal Abul Kashem Rd, Gabtoli, Dhaka",
    "description": "24-hour CNG and octane station near Gabtoli",
    "lat": 23.7823209,
    "lng": 90.348876,
    "fuelTypes": [
      "Octane",
      "CNG"
    ],
    "facilities": [
      "Prayer Room"
    ]
  },
  {
    "name": "M/S G. F. Trading (DL Filling Station)",
    "phone": "",
    "email": "",
    "address": "Service Rd, Uttara, Dhaka 1230",
    "description": "24-hour station on Dhaka-Mymensingh Hwy, Uttara",
    "lat": 23.8548041,
    "lng": 90.4054262,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "Diesel",
      "CNG"
    ],
    "facilities": [
      "Restroom"
    ]
  },
  {
    "name": "Uttara Filling and CNG Station",
    "phone": "+880 1798-501945",
    "email": "",
    "address": "Dhaka-Ashulia Hwy, Uttara, Dhaka 1230",
    "description": "Fuel and CNG station in Uttara",
    "lat": 23.8804705,
    "lng": 90.400521,
    "fuelTypes": [
      "Octane",
      "Diesel",
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "Cosmo Filling Station",
    "phone": "",
    "email": "",
    "address": "Uttara, Dhaka 1230",
    "description": "24-hour station in Uttara with car wash",
    "lat": 23.8685588,
    "lng": 90.4000045,
    "fuelTypes": [
      "Octane"
    ],
    "facilities": []
  },
  {
    "name": "Sheba Green Filling Station",
    "phone": "+880 1811-683423",
    "email": "",
    "address": "Mirpur Ashulia Road, Dhaka 1230",
    "description": "24-hour station, card payment accepted",
    "lat": 23.8796091,
    "lng": 90.3562248,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "Diesel",
      "LPG"
    ],
    "facilities": []
  },
  {
    "name": "East-West Filling Station 01",
    "phone": "+880 1713-861696",
    "email": "",
    "address": "House 71, Block D, Mirpur Rd, Ashulia 1711",
    "description": "24-hour station with parking space",
    "lat": 23.891965,
    "lng": 90.3621548,
    "fuelTypes": [
      "Octane"
    ],
    "facilities": []
  },
  {
    "name": "Gulshan Service Station",
    "phone": "+880 2222-287291",
    "email": "",
    "address": "102 Bir Uttam AK Khandakar Rd, Mohakhali, Dhaka 1213",
    "description": "Old station near Banglabhaban, open about 6:30 AM to 10 PM, card payment accepted",
    "lat": 23.7807307,
    "lng": 90.3995398,
    "fuelTypes": [
      "Octane"
    ],
    "facilities": []
  },
  {
    "name": "Clean Fuel Filling Station Ltd.",
    "phone": "+880 1708-480347",
    "email": "",
    "address": "46/1 Shaheed Tajuddin Ahmed Ave, Mohakhali, Dhaka 1208",
    "description": "24-hour station near Mohakhali bus stand, card payment accepted",
    "lat": 23.7730254,
    "lng": 90.3999632,
    "fuelTypes": [
      "Petrol",
      "Diesel",
      "CNG",
      "LPG"
    ],
    "facilities": []
  },
  {
    "name": "Royal Filling Station",
    "phone": "+880 1821-447722",
    "email": "",
    "address": "51/1 Shaheed Tajuddin Ahmed Sarani, Mohakhali, Dhaka 1212",
    "description": "24-hour fuel and CNG station in Mohakhali",
    "lat": 23.7746239,
    "lng": 90.3988613,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "Diesel",
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "Trust Filling Station",
    "phone": "",
    "email": "",
    "address": "278 Allen Badi, Old Airport Road, Tejgaon, Dhaka 1215",
    "description": "24-hour station, very busy, Padma Oil dealership",
    "lat": 23.7662879,
    "lng": 90.3891122,
    "fuelTypes": [
      "Octane"
    ],
    "facilities": []
  },
  {
    "name": "Tashofa Filling Station",
    "phone": "+880 1740-454701",
    "email": "",
    "address": "63 Shaheed Tajuddin Ahmed Ave, Dhaka 1212",
    "description": "24-hour Jamuna Oil dealer, cash only",
    "lat": 23.7765434,
    "lng": 90.398124,
    "fuelTypes": [
      "Octane",
      "Diesel"
    ],
    "facilities": []
  },
  {
    "name": "Sonar Bangla Service Station",
    "phone": "+880 1309-010236",
    "email": "",
    "address": "50 Avenue 1, Dhaka 1207",
    "description": "24-hour station with car wash, cash preferred",
    "lat": 23.7608229,
    "lng": 90.3723799,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "Diesel"
    ],
    "facilities": []
  },
  {
    "name": "M/S Talukder Filing & Servicing Centre",
    "phone": "+880 1744-377887",
    "email": "",
    "address": "Asad Gate Bus Stand, Dhaka 1205",
    "description": "24-hour station at Asad Gate, card payment accepted",
    "lat": 23.760426,
    "lng": 90.373258,
    "fuelTypes": [
      "Octane"
    ],
    "facilities": []
  },
  {
    "name": "Fuel Pump (Dhanmondi side)",
    "phone": "+880 1789-009619",
    "email": "",
    "address": "P9PM+GRG, Dhaka 1205",
    "description": "Roadside pump with U-turn facility, serves bikes and cars",
    "lat": 23.7363153,
    "lng": 90.3845838,
    "fuelTypes": [],
    "facilities": []
  },
  {
    "name": "Sadek Filling Station",
    "phone": "+880 1720-310163",
    "email": "",
    "address": "6 Sadarghat-Gabtoli Rd, Mohammadpur, Dhaka",
    "description": "24-hour busy station on Sadarghat-Gabtoli Rd",
    "lat": 23.7450551,
    "lng": 90.3596867,
    "fuelTypes": [],
    "facilities": []
  },
  {
    "name": "Sikder Petrol Pump",
    "phone": "+880 1711-334459",
    "email": "",
    "address": "74 Shahid Azauddin Ahmed Sarani, Sadarghat-Gabtoli Rd, Dhaka",
    "description": "24-hour station with car wash",
    "lat": 23.7412098,
    "lng": 90.3600919,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "Diesel"
    ],
    "facilities": []
  },
  {
    "name": "Karim & Sons",
    "phone": "+880 1710-828596",
    "email": "",
    "address": "13 Toyenbee Circular Road, Dhaka 1000",
    "description": "24-hour station near Motijheel and Kamalapur with car wash",
    "lat": 23.7276195,
    "lng": 90.4216969,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "CNG"
    ],
    "facilities": [
      "Prayer Room"
    ]
  },
  {
    "name": "Meghna Model Service Center",
    "phone": "+880 2-9615385",
    "email": "",
    "address": "17 Kazi Nazrul Islam Ave, Dhaka 1000",
    "description": "Old 24-hour station near Kazi Nazrul Islam Ave, always busy",
    "lat": 23.7418577,
    "lng": 90.3955078,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "Diesel"
    ],
    "facilities": []
  },
  {
    "name": "City Filling Station",
    "phone": "+880 1636-634514",
    "email": "",
    "address": "Shaheed Tajuddin Ahmed Ave, Dhaka 1208",
    "description": "24-hour station; reviews say gas only, no octane currently",
    "lat": 23.759656,
    "lng": 90.3990085,
    "fuelTypes": [
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "Zaman CNG & Filling Station Ltd.",
    "phone": "+880 1713-477378",
    "email": "",
    "address": "Bir Uttam Rafiqul Islam Ave, Dhaka 1212",
    "description": "24-hour CNG station",
    "lat": 23.770837,
    "lng": 90.4246328,
    "fuelTypes": [
      "CNG"
    ],
    "facilities": [
      "Restroom"
    ]
  },
  {
    "name": "Citizen CNG & Petroleum Filling Station",
    "phone": "+880 1939-033135",
    "email": "",
    "address": "Dhaka 1212",
    "description": "Small, busy CNG and petroleum station",
    "lat": 23.781002,
    "lng": 90.4255368,
    "fuelTypes": [
      "Petrol",
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "Hazipara CNG Filling Station",
    "phone": "+880 1875-446038",
    "email": "",
    "address": "DIT Rd, 61 E Hazipara, Malibagh, Dhaka 1219",
    "description": "Old 24-hour station on DIT Rd",
    "lat": 23.7570521,
    "lng": 90.4172015,
    "fuelTypes": [
      "Octane",
      "Diesel",
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "M/S Shikder Filling Station",
    "phone": "+880 1709-864182",
    "email": "",
    "address": "PFHP+GQC, Dhaka",
    "description": "24-hour station, card payment accepted",
    "lat": 23.7288098,
    "lng": 90.4868934,
    "fuelTypes": [
      "Petrol"
    ],
    "facilities": []
  },
  {
    "name": "Haq Filling Station",
    "phone": "",
    "email": "",
    "address": "PC6Q+7V3, Dhaka-Demra Hwy, Dhaka",
    "description": "24-hour station on Dhaka-Demra Hwy",
    "lat": 23.7106434,
    "lng": 90.4396616,
    "fuelTypes": [],
    "facilities": []
  },
  {
    "name": "Metro CNG Den & Food Safari",
    "phone": "+880 1712-093537",
    "email": "",
    "address": "A/1, 340 Dhaka-Mawa Hwy, Dhaka 1204",
    "description": "Large 24-hour CNG and LPG station with food corner and big parking",
    "lat": 23.7074781,
    "lng": 90.4350352,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "CNG",
      "LPG"
    ],
    "facilities": []
  },
  {
    "name": "Fatema Naz Petrol Pump",
    "phone": "",
    "email": "",
    "address": "PC4V+FGC, Dhaka-Chittagong Hwy, South Kajla, Jatrabari",
    "description": "24-hour highway station, CNG not available at the moment per reviews",
    "lat": 23.706186,
    "lng": 90.4437722,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "Diesel"
    ],
    "facilities": [
      "Restroom"
    ]
  },
  {
    "name": "Sikder Filling & Service Station",
    "phone": "+880 1711-334459",
    "email": "",
    "address": "74 Shaheed Tajuddin Ahmed Ave, Dhaka 1208",
    "description": "Small CNG station, open about 6:15 AM to 10:45 PM",
    "lat": 23.7710834,
    "lng": 90.4017684,
    "fuelTypes": [
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "KEECO Filling Station",
    "phone": "+880 1914-157833",
    "email": "",
    "address": "Nandipara, Rampura, Demra Road, Dhaka 1219",
    "description": "24-hour small station, supply can be irregular",
    "lat": 23.750342,
    "lng": 90.4578578,
    "fuelTypes": [
      "Octane",
      "LPG"
    ],
    "facilities": []
  },
  {
    "name": "Rajarbag Service Station (Petrol Pump and CNG Station)",
    "phone": "",
    "email": "",
    "address": "959 Outer Circular Road, Dhaka",
    "description": "24-hour small petrol and CNG station",
    "lat": 23.7423969,
    "lng": 90.4169665,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "Rahman Traders and CNG Refuelling Station",
    "phone": "+880 1711-539357",
    "email": "",
    "address": "Outer Circular Road, Dhaka",
    "description": "One of the oldest stations, 24-hour; reviews say fuel goes to govt vehicles in the afternoon",
    "lat": 23.7424386,
    "lng": 90.416887,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "Diesel",
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "Q. G. Samdani & Co Filling Station",
    "phone": "",
    "email": "",
    "address": "Nilkhet, near Mukti O Gonotontro Toron, Dhaka 1205",
    "description": "One of the oldest stations in Dhaka, with car wash; CNG reported closed",
    "lat": 23.7323903,
    "lng": 90.3866464,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "Diesel"
    ],
    "facilities": []
  },
  {
    "name": "Sonar Bangla CNG Filling Station",
    "phone": "+880 1925-071213",
    "email": "",
    "address": "P9FW+PPJ, Dhaka",
    "description": "CNG station with generator backup",
    "lat": 23.7243375,
    "lng": 90.3967656,
    "fuelTypes": [
      "CNG"
    ],
    "facilities": [
      "Restroom"
    ]
  },
  {
    "name": "SAM Associates Ltd.",
    "phone": "+880 1404-001968",
    "email": "",
    "address": "Mirpur Rd, Dhaka",
    "description": "24-hour station with car wash and service centre, mostly bikers",
    "lat": 23.8002786,
    "lng": 90.3566033,
    "fuelTypes": [
      "Octane",
      "Diesel"
    ],
    "facilities": []
  },
  {
    "name": "Diganta Filling Station",
    "phone": "+880 1966-853670",
    "email": "",
    "address": "Plot-A, 4 Mirpur Rd, Dhaka",
    "description": "Open about 6 AM to 12 AM, card payment accepted",
    "lat": 23.7988586,
    "lng": 90.3870327,
    "fuelTypes": [],
    "facilities": []
  },
  {
    "name": "S. S. Filling Station Nabil Bus",
    "phone": "+880 1712-222232",
    "email": "",
    "address": "15/2 Dhaka-Aricha Hwy, Gabtoli, Dhaka",
    "description": "24-hour station at Gabtoli with Nabil bus counter",
    "lat": 23.7827321,
    "lng": 90.3467925,
    "fuelTypes": [],
    "facilities": []
  },
  {
    "name": "INTRACO CNG & LPG Station",
    "phone": "",
    "email": "",
    "address": "12 Begum Rokeya Ave, Mirpur 12, Dhaka 1216",
    "description": "24-hour CNG and LPG station, no octane",
    "lat": 23.8284907,
    "lng": 90.3645467,
    "fuelTypes": [
      "CNG",
      "LPG"
    ],
    "facilities": [
      "Restroom"
    ]
  },
  {
    "name": "Mirpur Ceramics Works CNG Filling Station",
    "phone": "+880 1790-322495",
    "email": "",
    "address": "Mirpur 12 Ceramic Road, Dhaka 1216",
    "description": "Large CNG station with 8 nozzles and CNG conversion workshop",
    "lat": 23.8295261,
    "lng": 90.3642869,
    "fuelTypes": [
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "Comfort Filling & CNG Refueling Station",
    "phone": "+880 1781-187992",
    "email": "",
    "address": "3 Mirpur Rd, Kalyanpur, Dhaka 1207",
    "description": "24-hour station in Kalyanpur with car wash",
    "lat": 23.7791203,
    "lng": 90.3583485,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "Diesel"
    ],
    "facilities": []
  },
  {
    "name": "Shatabdi CNG Filling Station Ltd.",
    "phone": "+880 1928-514778",
    "email": "",
    "address": "Mirpur Rd, Dhaka 1216",
    "description": "24-hour CNG station with 4 nozzles",
    "lat": 23.8061111,
    "lng": 90.3738889,
    "fuelTypes": [
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "Skamco CNG Station",
    "phone": "+880 1911-436687",
    "email": "",
    "address": "R978+3W2, Mirpur, Dhaka 1216",
    "description": "24-hour CNG station, usually long queue",
    "lat": 23.8126464,
    "lng": 90.3672728,
    "fuelTypes": [
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "Nikunja Model Service Centre",
    "phone": "",
    "email": "",
    "address": "RCH9+2WJ, Kuril Flyover, Dhaka",
    "description": "24-hour station next to Kuril flyover, known for octane",
    "lat": 23.8275838,
    "lng": 90.4197783,
    "fuelTypes": [
      "Octane",
      "Diesel"
    ],
    "facilities": []
  },
  {
    "name": "Khilkhet LPG And Petrol Pump",
    "phone": "",
    "email": "",
    "address": "RCH9+2W3, Khilkhet, Dhaka 1229",
    "description": "24-hour station on Dhaka-Mymensingh Hwy, card payment accepted",
    "lat": 23.8275094,
    "lng": 90.4198085,
    "fuelTypes": [
      "Petrol",
      "LPG"
    ],
    "facilities": []
  },
  {
    "name": "City Overseas CNG Filling Station",
    "phone": "+880 1860-280290",
    "email": "",
    "address": "Road No. 2, Nikunja 2, Dhaka 1229",
    "description": "CNG station beside Dhaka Regency Hotel",
    "lat": 23.829062,
    "lng": 90.4195447,
    "fuelTypes": [
      "CNG",
      "Diesel"
    ],
    "facilities": []
  },
  {
    "name": "Safah CNG Refueling Station Ltd.",
    "phone": "",
    "email": "",
    "address": "Front Rd, beside Le Meridien, Dhaka",
    "description": "24-hour CNG station near airport road",
    "lat": 23.8358592,
    "lng": 90.4183146,
    "fuelTypes": [
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "Pinnacle CNG Station",
    "phone": "",
    "email": "",
    "address": "K/120 Pragati Ave, Dhaka 1229",
    "description": "CNG station on Pragati Ave",
    "lat": 23.8179175,
    "lng": 90.4211692,
    "fuelTypes": [
      "CNG",
      "Octane"
    ],
    "facilities": []
  },
  {
    "name": "Khaleque Service Station",
    "phone": "+880 1717-790483",
    "email": "",
    "address": "3 Mirpur Rd, Kalyanpur, Dhaka 1207",
    "description": "24-hour station with bus counters, car wash and workshop, card payment accepted",
    "lat": 23.7786724,
    "lng": 90.3572833,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "Diesel"
    ],
    "facilities": []
  },
  {
    "name": "Al-Mahmud Filling Station",
    "phone": "+880 1404-001969",
    "email": "",
    "address": "125/1 Principal Abul Kashem Rd, Technical More, Dhaka",
    "description": "24-hour station near Technical More, cash and card accepted",
    "lat": 23.7826506,
    "lng": 90.3521016,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "Diesel",
      "LPG"
    ],
    "facilities": []
  },
  {
    "name": "Shahjahan Enterprises Limited",
    "phone": "",
    "email": "",
    "address": "15 Kazi Nazrul Islam Ave, Dhaka 1215",
    "description": "Petrol and CNG station, open about 7:30 AM to 10 PM",
    "lat": 23.7422752,
    "lng": 90.3955592,
    "fuelTypes": [
      "Octane",
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "Saydabad CNG Filling Station",
    "phone": "",
    "email": "",
    "address": "PC7H+24W, Mayor Mohammad Hanif Flyover, Dhaka",
    "description": "24-hour station beside Sayedabad bus terminal, mainly buses and trucks",
    "lat": 23.7126092,
    "lng": 90.4278388,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "Diesel",
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "M/S Sobahan Filling Station",
    "phone": "",
    "email": "",
    "address": "Begum Rokeya Sarani, West Shewrapara, Dhaka 1207",
    "description": "24-hour CNG station near Taltola",
    "lat": 23.7882045,
    "lng": 90.377116,
    "fuelTypes": [
      "CNG"
    ],
    "facilities": [
      "Restroom"
    ]
  },
  {
    "name": "Anudip CNG & LPG Filling Station",
    "phone": "+880 1711-173851",
    "email": "",
    "address": "680 Boro Moghbazar, Dhaka 1217",
    "description": "24-hour CNG and LPG station with conversion service and vehicle wash",
    "lat": 23.7477907,
    "lng": 90.4036094,
    "fuelTypes": [
      "CNG",
      "LPG"
    ],
    "facilities": []
  },
  {
    "name": "Moin Motors Filling Station",
    "phone": "+880 1819-890952",
    "email": "",
    "address": "78/A Outer Circular Rd, Dhaka 1217",
    "description": "Spacious station on Outer Circular Rd",
    "lat": 23.7489245,
    "lng": 90.4068059,
    "fuelTypes": [],
    "facilities": []
  },
  {
    "name": "Ideal Filling Station",
    "phone": "",
    "email": "",
    "address": "191 Bir Uttam Mir Shawkat Sarak, Dhaka 1208",
    "description": "Open about 7 AM to 11 PM, card payment accepted, Padma Oil",
    "lat": 23.770208,
    "lng": 90.4082188,
    "fuelTypes": [
      "Octane"
    ],
    "facilities": []
  },
  {
    "name": "Gulistan Filling Station",
    "phone": "",
    "email": "",
    "address": "Ramna Bhaban, Bangabandhu Ave, Dhaka 1000",
    "description": "Small station near Gulistan",
    "lat": 23.726082,
    "lng": 90.411357,
    "fuelTypes": [],
    "facilities": []
  },
  {
    "name": "Shanto CNG Re-Fuelling Station",
    "phone": "+880 1798-881648",
    "email": "",
    "address": "Atish Deepankar Rd, Dhaka 1214",
    "description": "Open about 4:30 AM to 1:30 AM, near Kamalapur",
    "lat": 23.7290145,
    "lng": 90.4288526,
    "fuelTypes": [
      "Octane",
      "CNG",
      "LPG"
    ],
    "facilities": []
  },
  {
    "name": "NS CNG Filling and Servicing Center Ltd.",
    "phone": "+880 1711-525454",
    "email": "",
    "address": "PCFH+F9W, Dhaka Highway, Dhaka",
    "description": "24-hour CNG station with machine car wash and servicing",
    "lat": 23.7237395,
    "lng": 90.4284623,
    "fuelTypes": [
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "Makka CNG Refueling Station and Conversion Ltd.",
    "phone": "",
    "email": "",
    "address": "Cha 107, 1/A Bir Uttam Rafiqul Islam Ave, Uttar Badda, Dhaka 1212",
    "description": "24-hour station with CNG conversion centre, usually queue",
    "lat": 23.784236,
    "lng": 90.4256367,
    "fuelTypes": [
      "CNG",
      "Octane"
    ],
    "facilities": []
  },
  {
    "name": "M.M Builders & Engineers Ltd (Tasin CNG Filling Station)",
    "phone": "+880 1710-931778",
    "email": "",
    "address": "Abdullahpur Over Bridge, Dhaka 1230",
    "description": "24-hour station at Abdullahpur",
    "lat": 23.8811092,
    "lng": 90.4001856,
    "fuelTypes": [
      "Octane",
      "Diesel",
      "CNG",
      "LPG"
    ],
    "facilities": []
  },
  {
    "name": "Navana CNG Station Ltd.",
    "phone": "",
    "email": "",
    "address": "Q9M2+332, Dhaka-Aricha Hwy, Gabtoli, Dhaka",
    "description": "24-hour CNG station near Gabtoli",
    "lat": 23.7826318,
    "lng": 90.3501523,
    "fuelTypes": [
      "CNG",
      "Diesel"
    ],
    "facilities": []
  },
  {
    "name": "Hafiza CNG Filling Station",
    "phone": "",
    "email": "",
    "address": "Dhaka-Aricha Hwy, Dhaka",
    "description": "Large CNG station with car wash and repair",
    "lat": 23.7774583,
    "lng": 90.3625683,
    "fuelTypes": [
      "CNG"
    ],
    "facilities": [
      "Restroom"
    ]
  },
  {
    "name": "M/S Uttara Filling and CNG Station",
    "phone": "",
    "email": "",
    "address": "V9VP+WCF, Abdullahpur Hwy, Dhaka",
    "description": "Station on Abdullahpur Hwy, little data on Google Maps",
    "lat": 23.8948053,
    "lng": 90.3860417,
    "fuelTypes": [],
    "facilities": []
  },
  {
    "name": "M/S Latif & Sons Filling Station",
    "phone": "+880 1625-412431",
    "email": "",
    "address": "Bhatuliya, Dhaka",
    "description": "24-hour highway station",
    "lat": 23.8953895,
    "lng": 90.3772189,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "Diesel",
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "Islam Brother's LPG Filling Station",
    "phone": "+880 1751-311154",
    "email": "",
    "address": "Kamarpara, Uttara, Dhaka 1230",
    "description": "24-hour LPG and CNG station on Dhaka-Ashulia Hwy",
    "lat": 23.8960544,
    "lng": 90.3849511,
    "fuelTypes": [
      "LPG",
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "Hasan Filling & Servicing Center",
    "phone": "",
    "email": "",
    "address": "Begum Rokeya Sarani, Dhaka 1216",
    "description": "24-hour station near Taltola bus stand, mainly CNG",
    "lat": 23.7839072,
    "lng": 90.3781895,
    "fuelTypes": [
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "M/S Pather Bandhu Filling Station",
    "phone": "+880 1711-681139",
    "email": "",
    "address": "19 New Market, Mirpur Rd, Dhaka 1205",
    "description": "Small old station near New Market, open about 7 AM to 9 PM",
    "lat": 23.7321728,
    "lng": 90.3854345,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "Diesel"
    ],
    "facilities": [
      "Restroom"
    ]
  },
  {
    "name": "Merul Badda Filling Station",
    "phone": "+880 1616-183080",
    "email": "",
    "address": "Bir Uttam Rafiqul Islam Ave, Badda, Dhaka 1212",
    "description": "24-hour new station, card payment accepted",
    "lat": 23.7711911,
    "lng": 90.4253672,
    "fuelTypes": [
      "Octane",
      "LPG"
    ],
    "facilities": []
  },
  {
    "name": "Meghna Petrol Pump",
    "phone": "+880 1734-412095",
    "email": "",
    "address": "96-98 Mohakhali C/A, Dhaka 1212",
    "description": "Old station near Gulshan 1, open about 6 AM to 10 PM, with car servicing",
    "lat": 23.7808182,
    "lng": 90.4011056,
    "fuelTypes": [
      "Petrol",
      "Octane",
      "Diesel"
    ],
    "facilities": []
  },
  {
    "name": "CNG Pump (Keraniganj)",
    "phone": "",
    "email": "",
    "address": "Kalindi Rd, Keraniganj 1310",
    "description": "24-hour CNG pump, little data on Google Maps",
    "lat": 23.699796,
    "lng": 90.3770284,
    "fuelTypes": [
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "CNG Refuelling Station (Zinzira-Keraniganj Rd)",
    "phone": "+880 1984-435197",
    "email": "",
    "address": "M9X6+P5V, Zinzira-Keraniganj-Nawabganj Rd, Keraniganj",
    "description": "CNG station, reviews say cars not allowed",
    "lat": 23.6993635,
    "lng": 90.3604112,
    "fuelTypes": [
      "CNG"
    ],
    "facilities": []
  },
  {
    "name": "Tanaka Fuel Station",
    "phone": "",
    "email": "",
    "address": "P92W+GRQ, Keraniganj",
    "description": "Fuel station in Keraniganj",
    "lat": 23.7013309,
    "lng": 90.3971017,
    "fuelTypes": [],
    "facilities": []
  },
  {
    "name": "Kapasiya Filling Station",
    "phone": "+880 1743-593784",
    "email": "",
    "address": "P92V+H54, Keraniganj 1310",
    "description": "Fuel station in Keraniganj, little data on Google Maps",
    "lat": 23.7014,
    "lng": 90.3927,
    "fuelTypes": [],
    "facilities": []
  }
];

const generateSlug = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const seedPumps = async () => {
  let connected = false;

  try {
    if (!MONGO_URI) {
      throw new Error("DB_URL is missing from .env");
    }

    if (!ADMIN_ID || !mongoose.isValidObjectId(ADMIN_ID)) {
      throw new Error("Valid SEED_ADMIN_ID is required in .env");
    }

    await mongoose.connect(MONGO_URI);
    connected = true;

    console.log("MongoDB connected successfully.");

    const operations = [];
    const skippedPumps = [];

    for (const pump of pumpData) {
      const {
        name,
        phone,
        email,
        address,
        description,
        lat,
        lng,
        fuelTypes = [],
        facilities = [],
      } = pump;

      // Validate required information
      if (
        !name ||
        !address ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        skippedPumps.push({
          name: name || "Unknown",
          reason: "Invalid required information or GPS coordinates",
        });

        continue;
      }

      const slug = generateSlug(name);

      if (!slug) {
        skippedPumps.push({
          name,
          reason: "Invalid pump slug",
        });

        continue;
      }

      // Automatically detect Area using GPS
      const areas = await Area.find({
        isActive: true,
        boundary: {
          $geoIntersects: {
            $geometry: {
              type: "Point",
              coordinates: [lng, lat],
            },
          },
        },
      }).select("_id name division district");

      if (!areas.length) {
        skippedPumps.push({
          name,
          reason: "No matching Area boundary found",
        });

        continue;
      }

      // Use the first matching Area as the primary Area
      const primaryArea = areas[0];

      const pumpDocument = {
        name: name.trim(),
        slug,
        description: description || "",
        phone: phone || "",
        email: email || "",
        address: address.trim(),

        division: primaryArea.division,
        district: primaryArea.district,

        areaIds: areas.map((area) => area._id),

        location: {
          type: "Point",
          coordinates: [lng, lat],
        },

        fuelTypes,
        facilities,

        isOpen: false,
        isActive: true,
        verificationStatus: "pending",

        createdBy: ADMIN_ID,
      };

      operations.push({
        updateOne: {
          filter: { slug },
          update: {
            $setOnInsert: pumpDocument,
          },
          upsert: true,
        },
      });
    }

    if (!operations.length) {
      console.log("No valid pumps found to seed.");
    } else {
      const result = await Pump.bulkWrite(operations, {
        ordered: false,
      });

      
      console.log("PUMP SEED COMPLETED");
      console.log("Total submitted:", operations.length);
      console.log("Inserted:", result.upsertedCount);
      console.log("Already existed:", result.matchedCount);

    }

    if (skippedPumps.length) {
      console.log("SKIPPED PUMPS:");

      skippedPumps.forEach((pump) => {
        console.log(`${pump.name}: ${pump.reason}`);
      });

      console.log("Total skipped:", skippedPumps.length);
    }
  } catch (error) {
    console.error("PUMP SEED ERROR:", error);
    process.exitCode = 1;
  } finally {
    if (connected) {
      await mongoose.disconnect();
      console.log("MongoDB disconnected.");
    }
  }
};

seedPumps();
