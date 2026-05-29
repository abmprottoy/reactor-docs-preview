export const iconFilledClassName = "fui-Icon-filled";
export const iconRegularClassName = "fui-Icon-regular";

type IconProps = {
  className?: string;
  "aria-hidden"?: boolean;
};

function EmptyIcon({ className }: IconProps) {
  return <span className={className} aria-hidden="true" />;
}

export const ChevronDownRegular = EmptyIcon;
export const CheckmarkCircle12Filled = EmptyIcon;
export const DiamondDismiss12Filled = EmptyIcon;
export const Warning12Filled = EmptyIcon;
