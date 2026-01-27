import { cn } from "@/lib/utils";

type Role = "student" | "staff" | "admin";

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const roleStyles = {
    student: "bg-primary/15 text-primary border-primary/30",
    staff: "bg-accent/15 text-accent border-accent/30",
    admin: "bg-warning/15 text-warning border-warning/30",
  };

  const roleLabels = {
    student: "Student",
    staff: "Staff",
    admin: "Admin",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize",
        roleStyles[role],
        className
      )}
    >
      {roleLabels[role]}
    </span>
  );
}
