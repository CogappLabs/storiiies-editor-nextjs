// Stroke paths for the app's few icons, drawn on a 24-unit grid.
export const ICONS = {
  zoomIn: "M12 4v16m8-8H4",
  zoomOut: "M20 12H4",
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  crosshairs: "M12 4v4m0 8v4m-8-8h4m8 0h4",
  drag: "M4 8h16M4 16h16",
  audio:
    "M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z",
  edit: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z",
  delete:
    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
} as const;

interface IconProps {
  name: keyof typeof ICONS;
  className?: string;
}

/** Decorative: label the button or link that contains it. */
const Icon = ({ name, className = "w-4 h-4" }: IconProps) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d={ICONS[name]} />
  </svg>
);

export default Icon;
