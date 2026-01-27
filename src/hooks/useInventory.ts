import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function useInventory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const addOrUpdateComponent = useMutation({
    mutationFn: async ({
      name,
      description,
      category,
      quantity,
    }: {
      name: string;
      description: string;
      category: string;
      quantity: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // Normalize the name for comparison
      const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, "");

      // Check if component already exists
      const { data: existing } = await supabase
        .from("components")
        .select("*")
        .eq("normalized_name", normalizedName)
        .single();

      if (existing) {
        // Update existing component - increase quantity
        const { data, error } = await supabase
          .from("components")
          .update({
            quantity_available: existing.quantity_available + quantity,
            description: description || existing.description,
            category: category || existing.category,
          })
          .eq("id", existing.id)
          .select()
          .single();

        if (error) throw error;
        return { action: "updated", data };
      } else {
        // Create new component
        const { data, error } = await supabase
          .from("components")
          .insert({
            name,
            normalized_name: normalizedName,
            description,
            category: category || "General",
            quantity_available: quantity,
          })
          .select()
          .single();

        if (error) throw error;
        return { action: "created", data };
      }
    },
    onSuccess: ({ action }) => {
      queryClient.invalidateQueries({ queryKey: ["components"] });
      toast.success(
        action === "updated"
          ? "Component quantity updated successfully"
          : "New component added successfully"
      );
    },
    onError: (error) => {
      console.error("Error adding/updating component:", error);
      toast.error("Failed to update inventory. Please try again.");
    },
  });

  const updateComponentQuantity = useMutation({
    mutationFn: async ({
      componentId,
      newQuantity,
    }: {
      componentId: number;
      newQuantity: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("components")
        .update({ quantity_available: newQuantity })
        .eq("id", componentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["components"] });
      toast.success("Quantity updated successfully");
    },
    onError: (error) => {
      console.error("Error updating quantity:", error);
      toast.error("Failed to update quantity. Please try again.");
    },
  });

  const deleteComponent = useMutation({
    mutationFn: async (componentId: number) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("components")
        .delete()
        .eq("id", componentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["components"] });
      toast.success("Component deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting component:", error);
      toast.error("Failed to delete component. Please try again.");
    },
  });

  return {
    addOrUpdateComponent,
    updateComponentQuantity,
    deleteComponent,
  };
}
