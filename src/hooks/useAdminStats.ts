import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export interface AdminStats {
  totalStudents: number;
  totalStaff: number;
  totalAdmins: number;
  totalComponents: number;
  totalItemsInStock: number;
  lowStockComponents: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

export function useAdminStats() {
  const { user, role } = useAuth();

  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async (): Promise<AdminStats> => {
      // Fetch user role counts
      const { data: roleCounts, error: roleError } = await supabase
        .from("user_roles")
        .select("role");

      if (roleError) throw roleError;

      const studentCount = roleCounts?.filter((r) => r.role === "student").length || 0;
      const staffCount = roleCounts?.filter((r) => r.role === "staff").length || 0;
      const adminCount = roleCounts?.filter((r) => r.role === "admin").length || 0;

      // Fetch component stats
      const { data: components, error: compError } = await supabase
        .from("components")
        .select("quantity_available");

      if (compError) throw compError;

      const totalComponents = components?.length || 0;
      const totalItemsInStock = components?.reduce((sum, c) => sum + c.quantity_available, 0) || 0;
      const lowStockComponents = components?.filter((c) => c.quantity_available <= 5).length || 0;

      // Fetch request stats
      const { data: requests, error: reqError } = await supabase
        .from("requests")
        .select("status");

      if (reqError) throw reqError;

      const pendingRequests = requests?.filter((r) => r.status === "pending").length || 0;
      const approvedRequests = requests?.filter((r) => r.status === "approved").length || 0;
      const rejectedRequests = requests?.filter((r) => r.status === "rejected").length || 0;

      return {
        totalStudents: studentCount,
        totalStaff: staffCount,
        totalAdmins: adminCount,
        totalComponents,
        totalItemsInStock,
        lowStockComponents,
        pendingRequests,
        approvedRequests,
        rejectedRequests,
      };
    },
    enabled: !!user && role === "admin",
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}
