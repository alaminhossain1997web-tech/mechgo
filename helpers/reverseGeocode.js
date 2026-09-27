const reverseGeocode = async (longitude, latitude) => {
  try {
    if (
      typeof longitude !== "number" ||
      typeof latitude !== "number"
    ) {
      throw new Error("Invalid longitude or latitude");
    }

    const url =
      `https://api.mapbox.com/search/geocode/v6/reverse` +
      `?longitude=${longitude}` +
      `&latitude=${latitude}` +
      `&access_token=${process.env.MAPBOX_ACCESS_TOKEN}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.text();

      console.log("Mapbox Error:", errorData);

      throw new Error("Mapbox reverse geocoding failed");
    }

    const data = await response.json();

    const feature = data.features?.[0];

    if (!feature) {
      return {
        address: "",
        place: "",
        district: "",
        country: "",
      };
    }

    const properties = feature.properties || {};

    return {
      address: properties.full_address || properties.name || "",
      place: properties.context?.place?.name || "",
      district: properties.context?.district?.name || "",
      country: properties.context?.country?.name || "",
    };
  } catch (error) {
    console.log("Reverse Geocoding Error:", error.message);

    return {
      address: "",
      place: "",
      district: "",
      country: "",
    };
  }
};

module.exports = reverseGeocode;