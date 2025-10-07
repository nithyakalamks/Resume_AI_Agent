import { cn } from "@/lib/utils";

interface DecorativeGearProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  animate?: boolean;
}

export const DecorativeGear = ({ 
  size = "md", 
  className,
  animate = true 
}: DecorativeGearProps) => {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-32 h-32",
    lg: "w-48 h-48"
  };

  return (
    <svg
      viewBox="0 0 100 100"
      className={cn(
        sizeClasses[size],
        "opacity-10",
        animate && "animate-[spin_20s_linear_infinite]",
        className
      )}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="gearGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(193 75% 48%)" />
          <stop offset="50%" stopColor="hsl(169 48% 53%)" />
          <stop offset="100%" stopColor="hsl(100 61% 61%)" />
        </linearGradient>
      </defs>
      <g>
        {/* Central circle */}
        <circle cx="50" cy="50" r="20" fill="url(#gearGradient)" />
        
        {/* Gear teeth - 8 teeth around the circle */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => {
          const radians = (angle * Math.PI) / 180;
          const x1 = 50 + Math.cos(radians) * 20;
          const y1 = 50 + Math.sin(radians) * 20;
          const x2 = 50 + Math.cos(radians) * 35;
          const y2 = 50 + Math.sin(radians) * 35;
          const x3 = 50 + Math.cos(radians + 0.3) * 35;
          const y3 = 50 + Math.sin(radians + 0.3) * 35;
          const x4 = 50 + Math.cos(radians + 0.3) * 25;
          const y4 = 50 + Math.sin(radians + 0.3) * 25;
          const x5 = 50 + Math.cos(radians - 0.3) * 25;
          const y5 = 50 + Math.sin(radians - 0.3) * 25;
          const x6 = 50 + Math.cos(radians - 0.3) * 35;
          const y6 = 50 + Math.sin(radians - 0.3) * 35;
          
          return (
            <polygon
              key={index}
              points={`${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4} ${x5},${y5} ${x6},${y6}`}
              fill="url(#gearGradient)"
            />
          );
        })}
        
        {/* Inner circle hole */}
        <circle cx="50" cy="50" r="10" fill="transparent" stroke="url(#gearGradient)" strokeWidth="2" />
      </g>
    </svg>
  );
};
