import { useStrings } from "@/lib/i18n/LanguageProvider";
import Icon, { type ICONS } from "../ui/Icon";

interface ViewerControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onHome: () => void;
  showCrosshairs: boolean;
  onToggleCrosshairs?: () => void;
}

const ViewerControls = ({
  onZoomIn,
  onZoomOut,
  onHome,
  showCrosshairs,
  onToggleCrosshairs,
}: ViewerControlsProps) => {
  const { viewerControls } = useStrings();
  const buttons: {
    icon: keyof typeof ICONS;
    label: string;
    onClick?: () => void;
    pressed?: boolean;
  }[] = [
    { icon: "zoomIn", label: viewerControls.zoomIn, onClick: onZoomIn },
    { icon: "zoomOut", label: viewerControls.zoomOut, onClick: onZoomOut },
    { icon: "home", label: viewerControls.resetView, onClick: onHome },
    {
      icon: "crosshairs",
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
          <Icon name={icon} className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
};

export default ViewerControls;
