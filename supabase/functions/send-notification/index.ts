import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NotificationRequest {
  type: "new_request" | "request_approved" | "request_rejected";
  requestId: number;
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { type, requestId, rejectionReason }: NotificationRequest = await req.json();

    // Fetch request details with component and user info
    const { data: request, error: requestError } = await supabase
      .from("requests")
      .select(`
        *,
        component:components(id, name, category),
        profile:profiles!requests_user_id_fkey(id, email, full_name)
      `)
      .eq("id", requestId)
      .single();

    if (requestError || !request) {
      console.error("Error fetching request:", requestError);
      return new Response(
        JSON.stringify({ error: "Request not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log the notification (in production, this would send actual emails)
    console.log("=== NOTIFICATION ===");
    console.log("Type:", type);
    console.log("Request ID:", requestId);
    console.log("Component:", request.component?.name);
    console.log("Quantity:", request.quantity);
    console.log("Student:", request.profile?.full_name || request.profile?.email);

    let notificationDetails = {};

    switch (type) {
      case "new_request":
        // Notify staff about new request
        // In production: fetch all staff emails and send notification
        const { data: staffUsers } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "staff");

        if (staffUsers && staffUsers.length > 0) {
          const staffIds = staffUsers.map((s) => s.user_id);
          const { data: staffProfiles } = await supabase
            .from("profiles")
            .select("email, full_name")
            .in("id", staffIds);

          console.log("Would notify staff:", staffProfiles?.map((p) => p.email).join(", "));
          notificationDetails = {
            recipients: staffProfiles?.map((p) => p.email),
            subject: `New Component Request: ${request.component?.name}`,
            message: `${request.profile?.full_name || "A student"} has requested ${request.quantity}x ${request.component?.name}. Reason: ${request.reason || "Not specified"}`,
          };
        }
        break;

      case "request_approved":
        // Notify student about approval
        console.log("Would notify student:", request.profile?.email);
        notificationDetails = {
          recipient: request.profile?.email,
          subject: `Request Approved: ${request.component?.name}`,
          message: `Your request for ${request.quantity}x ${request.component?.name} has been approved. Please collect your components from the lab.`,
        };
        break;

      case "request_rejected":
        // Notify student about rejection
        console.log("Would notify student:", request.profile?.email);
        notificationDetails = {
          recipient: request.profile?.email,
          subject: `Request Rejected: ${request.component?.name}`,
          message: `Your request for ${request.quantity}x ${request.component?.name} has been rejected. Reason: ${rejectionReason || "No reason provided"}`,
        };
        break;
    }

    console.log("Notification details:", JSON.stringify(notificationDetails, null, 2));
    console.log("===================");

    // Return success
    // In production, integrate with Resend, SendGrid, or Supabase Edge Functions for actual email sending
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification logged successfully",
        details: notificationDetails 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
