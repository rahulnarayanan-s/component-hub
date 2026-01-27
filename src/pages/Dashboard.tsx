import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useComponents } from "@/hooks/useComponents";
import { useRequests } from "@/hooks/useRequests";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, FileText, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { format } from "date-fns";

export default function Dashboard() {
  const { user, role } = useAuth();
  const { components, isLoading: componentsLoading } = useComponents();
  const { requests, isLoading: requestsLoading } = useRequests(
    role === "student" ? "own" : "all"
  );

  const stats = {
    totalComponents: components.length,
    totalQuantity: components.reduce((sum, c) => sum + c.quantity_available, 0),
    pendingRequests: requests.filter((r) => r.status === "pending").length,
    approvedRequests: requests.filter((r) => r.status === "approved").length,
    rejectedRequests: requests.filter((r) => r.status === "rejected").length,
  };

  const recentRequests = requests.slice(0, 5);

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your lab components.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Components
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalComponents}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalQuantity} items in stock
              </p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Requests
              </CardTitle>
              <Clock className="h-4 w-4 text-pending" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingRequests}</div>
              <p className="text-xs text-muted-foreground">Awaiting review</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Approved
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approvedRequests}</div>
              <p className="text-xs text-muted-foreground">Requests fulfilled</p>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Rejected
              </CardTitle>
              <XCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejectedRequests}</div>
              <p className="text-xs text-muted-foreground">Not approved</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Requests */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Requests
            </CardTitle>
            <CardDescription>
              {role === "student"
                ? "Your latest component requests"
                : "Latest requests from all students"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading requests...
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No requests yet
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/30 border border-border/50"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">
                        {request.component?.name || "Unknown Component"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Qty: {request.quantity}
                        {request.reason && ` • ${request.reason}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert for Staff/Admin */}
        {(role === "staff" || role === "admin") && (
          <Card className="border-warning/30 bg-warning/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning">
                <TrendingUp className="h-5 w-5" />
                Low Stock Alert
              </CardTitle>
              <CardDescription>
                Components running low on inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              {componentsLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <div className="space-y-2">
                  {components
                    .filter((c) => c.quantity_available <= 5)
                    .slice(0, 5)
                    .map((component) => (
                      <div
                        key={component.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/50"
                      >
                        <span className="font-medium">{component.name}</span>
                        <span className="text-sm font-semibold text-warning">
                          {component.quantity_available} left
                        </span>
                      </div>
                    ))}
                  {components.filter((c) => c.quantity_available <= 5).length === 0 && (
                    <p className="text-center text-muted-foreground py-4">
                      All components are well stocked
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
