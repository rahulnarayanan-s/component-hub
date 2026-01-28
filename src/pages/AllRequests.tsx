import { useState } from "react";
import { useRequests } from "@/hooks/useRequests";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
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
import { FileText, Loader2, CheckCircle, XCircle, User, Mail, Hash } from "lucide-react";
import { format } from "date-fns";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function AllRequests() {
  const { requests, isLoading, updateRequest } = useRequests("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedRequest, setSelectedRequest] = useState<typeof requests[0] | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  const filteredRequests =
    statusFilter === "all"
      ? requests
      : requests.filter((r) => r.status === statusFilter);

  const handleApprove = async () => {
    if (!selectedRequest) return;
    await updateRequest.mutateAsync({
      requestId: selectedRequest.id,
      status: "approved",
    });
    setSelectedRequest(null);
    setActionType(null);
  };

  const handleReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) return;
    await updateRequest.mutateAsync({
      requestId: selectedRequest.id,
      status: "rejected",
      rejectionReason: rejectReason,
    });
    setSelectedRequest(null);
    setRejectReason("");
    setActionType(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">All Requests</h1>
            <p className="text-muted-foreground mt-1">
              Review and manage student requests
            </p>
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as StatusFilter)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Requests List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No requests found</h3>
              <p className="text-muted-foreground">
                {statusFilter === "all"
                  ? "No requests have been submitted yet"
                  : `No ${statusFilter} requests`}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {request.component?.name || "Unknown Component"}
                      </CardTitle>
                      <CardDescription>
                        Submitted on {format(new Date(request.created_at), "MMM d, yyyy 'at' h:mm a")}
                      </CardDescription>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Student Details Section */}
                  <div className="mb-4 p-4 rounded-lg bg-secondary/30 border border-border/50">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                      Student Information
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Name</p>
                          <p className="font-medium">
                            {request.profile?.full_name || "Not provided"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Email</p>
                          <p className="font-medium text-sm break-all">
                            {request.profile?.email || "Unknown"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Roll Number</p>
                          <p className="font-medium">
                            {request.profile?.roll_number || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Request Details */}
                  <div className="grid gap-4 sm:grid-cols-3 mb-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">
                        Quantity
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
                      <div className="sm:col-span-3">
                        <p className="text-sm font-medium text-muted-foreground">
                          Reason
                        </p>
                        <p className="text-foreground">{request.reason}</p>
                      </div>
                    )}
                  </div>

                  {request.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          setSelectedRequest(request);
                          setActionType("approve");
                        }}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-1 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => {
                          setSelectedRequest(request);
                          setActionType("reject");
                          setRejectReason("");
                        }}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}

                  {request.status === "rejected" && request.rejection_reason && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm font-medium text-destructive">
                        Rejection Reason
                      </p>
                      <p className="text-foreground mt-1">
                        {request.rejection_reason}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Approve Dialog */}
        <Dialog
          open={actionType === "approve" && !!selectedRequest}
          onOpenChange={(open) => !open && setActionType(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Request</DialogTitle>
              <DialogDescription>
                Are you sure you want to approve this request for{" "}
                {selectedRequest?.quantity}x {selectedRequest?.component?.name}?
                <br />
                <span className="text-muted-foreground">
                  Student: {selectedRequest?.profile?.full_name || selectedRequest?.profile?.email}
                </span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionType(null)}>
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={updateRequest.isPending}>
                {updateRequest.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Approve"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog
          open={actionType === "reject" && !!selectedRequest}
          onOpenChange={(open) => !open && setActionType(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Request</DialogTitle>
              <DialogDescription>
                Please provide a reason for rejecting this request from{" "}
                {selectedRequest?.profile?.full_name || selectedRequest?.profile?.email}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="reject-reason">Rejection Reason</Label>
              <Textarea
                id="reject-reason"
                placeholder="Explain why this request is being rejected..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionType(null)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={updateRequest.isPending || !rejectReason.trim()}
              >
                {updateRequest.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Reject Request"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
