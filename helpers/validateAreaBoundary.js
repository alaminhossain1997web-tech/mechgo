
const validateAreaBoundary = (boundary) => {
  if (!boundary) return false;

  if (!["Polygon", "MultiPolygon"].includes(boundary.type)) {
    return false;
  }

  if (!Array.isArray(boundary.coordinates)) {
    return false;
  }

  const validatePosition = (position) => {
    return (
      Array.isArray(position) &&
      position.length >= 2 &&
      Number.isFinite(position[0]) &&
      Number.isFinite(position[1]) &&
      position[0] >= -180 &&
      position[0] <= 180 &&
      position[1] >= -90 &&
      position[1] <= 90
    );
  };

  const validateRing = (ring) => {
    if (!Array.isArray(ring) || ring.length < 4) {
      return false;
    }

    if (!ring.every(validatePosition)) {
      return false;
    }

    const first = ring[0];
    const last = ring[ring.length - 1];

    return (
      first[0] === last[0] &&
      first[1] === last[1]
    );
  };

  const polygons =
    boundary.type === "Polygon"
      ? [boundary.coordinates]
      : boundary.coordinates;

  if (!polygons.length) return false;

  return polygons.every((polygon) => {
    return (
      Array.isArray(polygon) &&
      polygon.length > 0 &&
      polygon.every(validateRing)
    );
  });
};

module.exports = validateAreaBoundary;
