import PropTypes from "prop-types";
import { Plane, Ship, Truck } from "lucide-react";

/** Renders the transport icon appropriate to a shipment mode. */
export default function ModeIcon({ mode, size = 18 }) {
  const Icon = mode === "air" ? Plane : mode === "sea" ? Ship : Truck;
  return (
    <Icon
      size={size}
      strokeWidth={2}
      aria-label={`${mode} shipment`}
      title={`${mode[0].toUpperCase()}${mode.slice(1)} shipment`}
    />
  );
}

ModeIcon.propTypes = {
  mode: PropTypes.oneOf(["air", "ground", "sea"]).isRequired,
  size: PropTypes.number,
};
