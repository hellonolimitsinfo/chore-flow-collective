
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  householdId: string;
  householdName: string;
  inviteEmail: string;
  inviterName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { householdId, householdName, inviteEmail, inviterName }: InvitationRequest = await req.json();

    console.log("Sending invitation:", { householdId, householdName, inviteEmail, inviterName });

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    const emailResponse = await resend.emails.send({
      from: "Flatmate Flow <onboarding@resend.dev>",
      to: [inviteEmail],
      subject: `You're invited to join ${householdName}!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">You're invited to join ${householdName}!</h1>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Hi there! ${inviterName} has invited you to join their household "${householdName}" on Flatmate Flow.
          </p>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Flatmate Flow helps you and your household members keep track of chores, shopping lists, and shared expenses all in one place.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get("SUPABASE_URL")?.replace('/rest/v1', '')}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              Join ${householdName}
            </a>
          </div>
          
          <p style="font-size: 14px; color: #777; text-align: center;">
            If you didn't expect this invitation, you can safely ignore this email.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="font-size: 12px; color: #999; text-align: center;">
            This invitation was sent from Flatmate Flow
          </p>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending invitation:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
