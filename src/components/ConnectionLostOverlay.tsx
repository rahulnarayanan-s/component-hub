import { Loader2, WifiOff } from "lucide-react";

export function ConnectionLostOverlay() {
  return (
    <div className="connection-lost-overlay">
      <div className="flex flex-col items-center gap-6 text-center p-8">
        <div className="relative">
          <WifiOff className="h-16 w-16 text-muted-foreground" />
          <Loader2 className="h-8 w-8 text-primary absolute -bottom-2 -right-2 animate-spin" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Oops… connection lost
          </h2>
          <p className="text-muted-foreground">
            Please wait a moment.
          </p>
        </div>
      </div>
    </div>
  );
}
