import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Component {
  id: number;
  name: string;
  normalized_name: string;
  description: string | null;
  category: string;
  quantity_available: number;
  created_at: string;
  updated_at: string;
}

export function useComponents() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: components = [], isLoading, error, refetch } = useQuery({
    queryKey: ["components"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("components")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Component[];
    },
  });

  // Fuzzy search implementation
  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) return components;

    const normalizedQuery = searchQuery.toLowerCase().replace(/[^a-z0-9]/g, "");

    return components.filter((component) => {
      // Exact match on normalized name
      if (component.normalized_name.includes(normalizedQuery)) return true;

      // Case-insensitive match on name
      if (component.name.toLowerCase().includes(searchQuery.toLowerCase()))
        return true;

      // Levenshtein distance for typo tolerance (simple implementation)
      const distance = levenshteinDistance(
        normalizedQuery,
        component.normalized_name
      );
      const maxDistance = Math.floor(normalizedQuery.length * 0.3); // Allow 30% errors
      return distance <= maxDistance && distance <= 3;
    });
  }, [components, searchQuery]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(components.map((c) => c.category));
    return Array.from(cats).sort();
  }, [components]);

  return {
    components: filteredComponents,
    allComponents: components,
    categories,
    isLoading,
    error,
    refetch,
    searchQuery,
    setSearchQuery,
  };
}

// Simple Levenshtein distance implementation
function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
