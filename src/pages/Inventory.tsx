import { useState } from "react";
import { useComponents } from "@/hooks/useComponents";
import { useInventory } from "@/hooks/useInventory";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Plus, Loader2, Pencil, Trash2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Inventory() {
  const { allComponents, isLoading, categories, searchQuery, setSearchQuery, refetch } = useComponents();
  const { addOrUpdateComponent, updateComponentQuantity, deleteComponent } = useInventory();

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<typeof allComponents[0] | null>(null);
  const [deletingComponent, setDeletingComponent] = useState<typeof allComponents[0] | null>(null);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState("General");
  const [newQuantity, setNewQuantity] = useState(1);

  // Edit form state
  const [editQuantity, setEditQuantity] = useState(0);

  const filteredComponents = searchQuery
    ? allComponents.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allComponents;

  const handleAddComponent = async () => {
    if (!newName.trim()) return;

    await addOrUpdateComponent.mutateAsync({
      name: newName,
      description: newDescription,
      category: newCategory || "General",
      quantity: newQuantity,
    });

    setAddDialogOpen(false);
    setNewName("");
    setNewDescription("");
    setNewCategory("General");
    setNewQuantity(1);
  };

  const handleUpdateQuantity = async () => {
    if (!editingComponent) return;

    await updateComponentQuantity.mutateAsync({
      componentId: editingComponent.id,
      newQuantity: editQuantity,
    });

    setEditingComponent(null);
  };

  const handleDelete = async () => {
    if (!deletingComponent) return;

    await deleteComponent.mutateAsync(deletingComponent.id);
    setDeletingComponent(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manage Inventory</h1>
            <p className="text-muted-foreground mt-1">
              Add, edit, and remove components from inventory
            </p>
          </div>
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Component
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Component</DialogTitle>
                <DialogDescription>
                  If a component with the same name exists, the quantity will be added to it.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Component Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Arduino Uno"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the component..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newCategory} onValueChange={setNewCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Microcontrollers">Microcontrollers</SelectItem>
                      <SelectItem value="Sensors">Sensors</SelectItem>
                      <SelectItem value="Motors">Motors</SelectItem>
                      <SelectItem value="Power">Power</SelectItem>
                      <SelectItem value="Displays">Displays</SelectItem>
                      <SelectItem value="Communication">Communication</SelectItem>
                      <SelectItem value="Connectors">Connectors</SelectItem>
                      <SelectItem value="Tools">Tools</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity to Add</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleAddComponent}
                  disabled={addOrUpdateComponent.isPending || !newName.trim()}
                >
                  {addOrUpdateComponent.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Component"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <Card className="border-border/50">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search components..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Components Table */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle>All Components</CardTitle>
            <CardDescription>
              {allComponents.length} components in inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredComponents.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No components found</h3>
                <p className="text-muted-foreground">
                  Add your first component to get started
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredComponents.map((component) => (
                      <TableRow key={component.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{component.name}</p>
                            {component.description && (
                              <p className="text-sm text-muted-foreground line-clamp-1">
                                {component.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{component.category}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={`font-semibold ${
                              component.quantity_available <= 5
                                ? "text-warning"
                                : component.quantity_available === 0
                                ? "text-destructive"
                                : ""
                            }`}
                          >
                            {component.quantity_available}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setEditingComponent(component);
                                setEditQuantity(component.quantity_available);
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeletingComponent(component)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Quantity Dialog */}
        <Dialog
          open={!!editingComponent}
          onOpenChange={(open) => !open && setEditingComponent(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Quantity</DialogTitle>
              <DialogDescription>
                Update the quantity for {editingComponent?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="edit-quantity">Current Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                min={0}
                value={editQuantity}
                onChange={(e) => setEditQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingComponent(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleUpdateQuantity}
                disabled={updateComponentQuantity.isPending}
              >
                {updateComponentQuantity.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={!!deletingComponent}
          onOpenChange={(open) => !open && setDeletingComponent(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Component</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{deletingComponent?.name}"? This action
                cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingComponent(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteComponent.isPending}
              >
                {deleteComponent.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
