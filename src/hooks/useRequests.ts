import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export interface Request {
  id: number;
  user_id: string;
  component_id: number;
  quantity: number;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  staff_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  component?: {
    id: number;
    name: string;
    category: string;
  };
  profile?: {
    email: string;
    full_name: string | null;
    roll_number: string | null;
    employee_id: string | null;
  };
}

export function useRequests(viewType: "own" | "all" = "own") {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading, error, refetch } = useQuery({
    queryKey: ["requests", viewType, user?.id],
    queryFn: async () => {
      let query = supabase
        .from("requests")
        .select(`
          *,
          component:components(id, name, category)
        `)
        .order("created_at", { ascending: false });

      if (viewType === "own" && user) {
        query = query.eq("user_id", user.id);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user profiles for staff/admin views with extended fields
      if (viewType === "all" && data && data.length > 0) {
        const userIds = [...new Set(data.map((r) => r.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, full_name, roll_number, employee_id")
          .in("id", userIds);

        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

        return data.map((r) => ({
          ...r,
          profile: profileMap.get(r.user_id) || { email: "Unknown", full_name: null, roll_number: null, employee_id: null },
        })) as Request[];
      }

      return data as Request[];
    },
    enabled: !!user,
  });

  const createRequest = useMutation({
    mutationFn: async ({
      componentId,
      quantity,
      reason,
    }: {
      componentId: number;
      quantity: number;
      reason: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.from("requests").insert({
        user_id: user.id,
        component_id: componentId,
        quantity,
        reason,
        status: "pending",
      }).select().single();

      if (error) throw error;

      // Trigger email notification to staff (fire and forget)
      try {
        await supabase.functions.invoke("send-notification", {
          body: {
            type: "new_request",
            requestId: data.id,
          },
        });
      } catch (e) {
        console.error("Failed to send notification:", e);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      toast.success("Request submitted successfully");
    },
    onError: (error) => {
      console.error("Error creating request:", error);
      toast.error("Failed to submit request. Please try again.");
    },
  });

  const updateRequest = useMutation({
    mutationFn: async ({
      requestId,
      status,
      rejectionReason,
    }: {
      requestId: number;
      status: "approved" | "rejected";
      rejectionReason?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // If approving, first check component quantity
      if (status === "approved") {
        const request = requests.find((r) => r.id === requestId);
        if (!request) throw new Error("Request not found");

        const { data: component, error: compError } = await supabase
          .from("components")
          .select("quantity_available")
          .eq("id", request.component_id)
          .single();

        if (compError) throw compError;

        if (component.quantity_available < request.quantity) {
          throw new Error("Insufficient quantity available");
        }

        // Update component quantity
        const { error: updateCompError } = await supabase
          .from("components")
          .update({
            quantity_available: component.quantity_available - request.quantity,
          })
          .eq("id", request.component_id);

        if (updateCompError) throw updateCompError;
      }

      const updateData: Record<string, unknown> = {
        status,
        staff_id: user.id,
      };

      if (status === "rejected" && rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { data, error } = await supabase
        .from("requests")
        .update(updateData)
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;

      // Trigger email notification to student (fire and forget)
      try {
        await supabase.functions.invoke("send-notification", {
          body: {
            type: status === "approved" ? "request_approved" : "request_rejected",
            requestId: data.id,
            rejectionReason: rejectionReason,
          },
        });
      } catch (e) {
        console.error("Failed to send notification:", e);
      }

      return data;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["requests"] });
      queryClient.invalidateQueries({ queryKey: ["components"] });
      toast.success(
        status === "approved"
          ? "Request approved successfully"
          : "Request rejected"
      );
    },
    onError: (error: Error) => {
      console.error("Error updating request:", error);
      if (error.message === "Insufficient quantity available") {
        toast.error("Cannot approve: insufficient quantity available");
      } else {
        toast.error("Failed to update request. Please try again.");
      }
    },
  });

  return {
    requests,
    isLoading,
    error,
    refetch,
    createRequest,
    updateRequest,
  };
}
