import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useComponents } from "@/hooks/useComponents";
import { useRequests } from "@/hooks/useRequests";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Package, Plus, Minus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Components() {
  const { role } = useAuth();
  const { components, isLoading, searchQuery, setSearchQuery, categories } = useComponents();
  const { createRequest } = useRequests("own");
  
  const [selectedComponent, setSelectedComponent] = useState<typeof components[0] | null>(null);
  const [requestQuantity, setRequestQuantity] = useState(1);
  const [requestReason, setRequestReason] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const filteredByCategory = selectedCategory === "all"
    ? components
    : components.filter((c) => c.category === selectedCategory);

  const handleSubmitRequest = async () => {
    if (!selectedComponent) return;

    await createRequest.mutateAsync({
      componentId: selectedComponent.id,
      quantity: requestQuantity,
      reason: requestReason,
    });

    setSelectedComponent(null);
    setRequestQuantity(1);
    setRequestReason("");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Components</h1>
          <p className="text-muted-foreground mt-1">
            Browse available lab components
            {role === "student" && " and request what you need"}
          </p>
        </div>

        {/* Search and Filter */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search components (typo-tolerant)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Components Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredByCategory.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No components found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredByCategory.map((component) => (
              <Card
                key={component.id}
                className="border-border/50 hover:border-primary/30 transition-colors"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{component.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {component.category}
                      </Badge>
                    </div>
                    <div
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        component.quantity_available > 10
                          ? "bg-success/15 text-success"
                          : component.quantity_available > 0
                          ? "bg-warning/15 text-warning"
                          : "bg-destructive/15 text-destructive"
                      }`}
                    >
                      {component.quantity_available} available
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {component.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {component.description}
                    </p>
                  )}
                  {role === "student" && component.quantity_available > 0 && (
                    <Button
                      className="w-full"
                      onClick={() => {
                        setSelectedComponent(component);
                        setRequestQuantity(1);
                      }}
                    >
                      Request Component
                    </Button>
                  )}
                  {role === "student" && component.quantity_available === 0 && (
                    <Button className="w-full" disabled>
                      Out of Stock
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Request Dialog */}
        <Dialog
          open={!!selectedComponent}
          onOpenChange={(open) => !open && setSelectedComponent(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Component</DialogTitle>
              <DialogDescription>
                Submit a request for {selectedComponent?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setRequestQuantity(Math.max(1, requestQuantity - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    min={1}
                    max={selectedComponent?.quantity_available || 1}
                    value={requestQuantity}
                    onChange={(e) =>
                      setRequestQuantity(
                        Math.min(
                          selectedComponent?.quantity_available || 1,
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      )
                    }
                    className="w-20 text-center"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() =>
                      setRequestQuantity(
                        Math.min(
                          selectedComponent?.quantity_available || 1,
                          requestQuantity + 1
                        )
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    / {selectedComponent?.quantity_available} available
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Reason for request</Label>
                <Textarea
                  id="reason"
                  placeholder="Describe why you need this component..."
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedComponent(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmitRequest}
                disabled={createRequest.isPending}
              >
                {createRequest.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Request"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
