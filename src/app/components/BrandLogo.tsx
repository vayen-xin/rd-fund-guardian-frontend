import brandLogoUrl from "../assets/brand-logo-v.svg";

type BrandLogoProps = {
  size?: number;
  className?: string;
};

export function BrandLogo({ size = 48, className = "" }: BrandLogoProps) {
  return (
    <img
      src={brandLogoUrl}
      alt="V 品牌 Logo"
      width={size}
      height={size}
      className={`shrink-0 select-none ${className}`}
      draggable={false}
    />
  );
}
