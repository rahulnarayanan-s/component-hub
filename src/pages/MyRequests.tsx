import { useRequests } from "@/hooks/useRequests";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function MyRequests() {
  const { requests, isLoading } = useRequests("own");

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Requests</h1>
          <p className="text-muted-foreground mt-1">
            Track the status of your component requests
          </p>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No requests yet</h3>
              <p className="text-muted-foreground">
                Browse components and submit your first request
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {request.component?.name || "Unknown Component"}
                      </CardTitle>
                      <CardDescription>
                        Requested on{" "}
                        {format(new Date(request.created_at), "MMMM d, yyyy 'at' h:mm a")}
                      </CardDescription>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Quantity Requested
                      </p>
                      <p className="text-lg font-semibold">{request.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Category
                      </p>
                      <p className="text-lg font-semibold">
                        {request.component?.category || "N/A"}
                      </p>
                    </div>
                    {request.reason && (
                      <div className="sm:col-span-2">
                        <p className="text-sm font-medium text-muted-foreground">
                          Reason
                        </p>
                        <p className="text-foreground">{request.reason}</p>
                      </div>
                    )}
                    {request.status === "rejected" && request.rejection_reason && (
                      <div className="sm:col-span-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm font-medium text-destructive">
                          Rejection Reason
                        </p>
                        <p className="text-foreground mt-1">
                          {request.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
