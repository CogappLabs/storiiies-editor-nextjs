import { useStrings } from "@/lib/i18n/LanguageProvider";

interface ViewerControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onHome: () => void;
  showCrosshairs: boolean;
  onToggleCrosshairs?: () => void;
}

const ICONS = {
  zoomIn: "M12 4v16m8-8H4",
  zoomOut: "M20 12H4",
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  crosshairs: "M12 4v4m0 8v4m-8-8h4m8 0h4",
};

const ViewerControls = ({
  onZoomIn,
  onZoomOut,
  onHome,
  showCrosshairs,
  onToggleCrosshairs,
}: ViewerControlsProps) => {
  const { viewerControls } = useStrings();
  const buttons = [
    { icon: ICONS.zoomIn, label: viewerControls.zoomIn, onClick: onZoomIn },
    { icon: ICONS.zoomOut, label: viewerControls.zoomOut, onClick: onZoomOut },
    { icon: ICONS.home, label: viewerControls.resetView, onClick: onHome },
    {
      icon: ICONS.crosshairs,
      label: showCrosshairs
        ? viewerControls.hideCrosshairs
        : viewerControls.showCrosshairs,
      onClick: onToggleCrosshairs,
      pressed: showCrosshairs,
    },
  ];

  return (
    <div className="absolute top-4 left-4 flex gap-1 z-10">
      {buttons.map(({ icon, label, onClick, pressed }) => (
        <button
          key={icon}
          type="button"
          onClick={onClick}
          aria-label={label}
          aria-pressed={pressed}
          className={`p-2 shadow border border-cogapp-charcoal/20 ${
            pressed
              ? "bg-cogapp-charcoal text-cogapp-cream"
              : "bg-white hover:bg-cogapp-cream"
          }`}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d={icon} />
          </svg>
        </button>
      ))}
    </div>
  );
};

export default ViewerControls;
