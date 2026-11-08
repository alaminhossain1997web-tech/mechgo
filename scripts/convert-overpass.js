
const fs = require("fs");
const path = require("path");

// Project root থেকে export.geojson পড়বে
const inputPath = path.join(__dirname, "../export.geojson");

// Output project root-এ new-areas.txt তৈরি করবে
const outputPath = path.join(__dirname, "../new-areas.txt");

if (!fs.existsSync(inputPath)) {
  console.error("❌ export.geojson file paoa jayni:", inputPath);
  process.exit(1);
}

const overpassData = JSON.parse(
  fs.readFileSync(inputPath, "utf8")
);

function makeSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Point-এর চারপাশে ছোট Polygon তৈরি
function pointToPolygon(lng, lat) {
  const d = 0.005;

  return [[
    [lng - d, lat - d],
    [lng + d, lat - d],
    [lng + d, lat + d],
    [lng - d, lat + d],
    [lng - d, lat - d]
  ]];
}

const features = overpassData.features || [];

const newAreas = features.map((f) => {
  const name = f.properties?.name || f.properties?.tags?.name;

  if (!name || !f.geometry) return null;

  let lng;
  let lat;

  // Point geometry
  if (f.geometry.type === "Point") {
    [lng, lat] = f.geometry.coordinates;
  }
  // Polygon geometry হলে center নেওয়া
  else if (f.geometry.type === "Polygon") {
    const coordinates = f.geometry.coordinates[0];
    lng = coordinates.reduce((sum, p) => sum + p[0], 0) / coordinates.length;
    lat = coordinates.reduce((sum, p) => sum + p[1], 0) / coordinates.length;
  }
  else {
    return null;
  }

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null;
  }

  return {
    name,
    slug: makeSlug(name),
    division: "Dhaka",
    district: "Dhaka",
    isActive: true,
    boundary: {
      type: "Polygon",
      coordinates: pointToPolygon(lng, lat)
    }
  };
}).filter(Boolean);

// Duplicate slug বাদ দেওয়া
const uniqueAreas = [
  ...new Map(newAreas.map((area) => [area.slug, area])).values()
];

console.log(`Total ${uniqueAreas.length} ta area convert hoise`);

const output = uniqueAreas.map((a) => {
  return `  {
    name: ${JSON.stringify(a.name)},
    slug: ${JSON.stringify(a.slug)},
    division: "Dhaka",
    district: "Dhaka",
    isActive: true,
    boundary: {
      type: "Polygon",
      coordinates: ${JSON.stringify(a.boundary.coordinates)}
    },
  },`;
}).join("\n");

fs.writeFileSync(outputPath, output, "utf8");

console.log("Done! new-areas.txt file ready");
console.log("Output:", outputPath);
