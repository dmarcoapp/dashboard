import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

// Subtle broken shield SVG component
function BrokenShield() {
  return (
    <div className="relative w-32 h-32 md:w-40 md:h-40">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Left half of broken shield */}
        <path
          d="M50 10 L20 25 L20 55 C20 70 35 85 50 90"
          fill="hsl(var(--primary) / 0.1)"
          stroke="hsl(var(--primary))"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        
        {/* Right half of broken shield - slightly offset */}
        <g style={{ transform: 'translate(3px, 2px)' }}>
          <path
            d="M50 10 L80 25 L80 55 C80 70 65 85 50 90"
            fill="hsl(var(--muted) / 0.5)"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="8 4"
          />
        </g>
        
        {/* Crack line */}
        <path
          d="M50 18 L48 35 L53 50 L47 65 L50 82"
          fill="none"
          stroke="hsl(var(--muted-foreground) / 0.5)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* X mark */}
        <circle cx="50" cy="48" r="10" fill="hsl(var(--destructive) / 0.15)" />
        <path
          d="M45 43 L55 53 M55 43 L45 53"
          stroke="hsl(var(--destructive))"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-md animate-fade-in">
        {/* Broken shield icon */}
        <div className="flex justify-center">
          <BrokenShield />
        </div>
        
        {/* 404 text */}
        <div className="space-y-2">
          <h1 className="text-6xl md:text-7xl font-bold text-primary">
            404
          </h1>
          <p className="text-lg md:text-xl font-medium text-foreground">
            Page Not Found
          </p>
        </div>
        
        {/* Message */}
        <p className="text-muted-foreground">
          You've reached a page that doesn't exist. We're sorry for the inconvenience.
        </p>
        
        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button 
            onClick={() => navigate('/')}
            className="min-w-[140px] gap-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>
          <Button 
            onClick={() => navigate(-1)}
            variant="outline"
            className="min-w-[140px] gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
        
        {/* Route info */}
        <p className="text-xs text-muted-foreground/60 pt-4">
          <code className="font-mono">{location.pathname}</code>
        </p>
      </div>
    </div>
  );
};

export default NotFound;
