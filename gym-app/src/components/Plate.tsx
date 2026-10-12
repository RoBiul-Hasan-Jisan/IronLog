import { plateColor } from "@/lib/plates";

/** A small weight-plate marker in the colour of a muscle group. */
export function Plate({
  bodyPart,
  color,
  size = 20,
  hole = "var(--plate-hole, #fff)",
}: {
  /** Pass a body part to get its plate colour… */
  bodyPart?: string;
  /** …or an explicit colour. */
  color?: string;
  size?: number;
  /** Colour of the centre hole — should match the surface behind the plate. */
  hole?: string;
}) {
  const fill = color ?? plateColor(bodyPart ?? "");
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="plate">
      <circle cx="12" cy="12" r="11.25" fill={fill} />
      <circle cx="12" cy="12" r="8.2" fill="none" stroke="rgba(255,255,255,.55)" strokeWidth="1.2" />
      <circle cx="12" cy="12" r="3.1" fill={hole} />
    </svg>
  );
}
