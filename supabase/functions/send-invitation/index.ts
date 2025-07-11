
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

    // Look up the user by email in profiles table
    const { data: userProfile, error: userError } = await supabaseClient
      .from('profiles')
      .select('id')
      .eq('email', inviteEmail)
      .maybeSingle();

    if (userError) {
      console.error('Error looking up user:', userError);
      return new Response(
        JSON.stringify({ error: "Failed to lookup user" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // If user exists, check if they're already a member of this household
    if (userProfile) {
      const { data: existingMember, error: memberError } = await supabaseClient
        .from('household_members')
        .select('id')
        .eq('household_id', householdId)
        .eq('user_id', userProfile.id)
        .maybeSingle();

      if (memberError) {
        console.error('Error checking existing membership:', memberError);
        return new Response(
          JSON.stringify({ error: "Failed to check membership" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      if (existingMember) {
        return new Response(
          JSON.stringify({ error: "User is already a member of this household" }),
          {
            status: 409,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      // If user exists and isn't a member, add them directly
      const { error: addMemberError } = await supabaseClient
        .from('household_members')
        .insert({
          household_id: householdId,
          user_id: userProfile.id,
          role: 'member'
        });

      if (addMemberError) {
        console.error('Error adding existing user to household:', addMemberError);
        return new Response(
          JSON.stringify({ error: "Failed to add user to household" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    } else {
      // If user doesn't exist, create a pending invitation record
      const invitationToken = crypto.randomUUID();
      
      const { error: inviteError } = await supabaseClient
        .from('household_invitations')
        .insert({
          household_id: householdId,
          email: inviteEmail,
          token: invitationToken,
          invited_by: req.headers.get("Authorization") ? 
            (await supabaseClient.auth.getUser()).data.user?.id : null
        });

      if (inviteError) {
        console.error('Error creating invitation record:', inviteError);
        // Continue with email sending even if invitation record fails
      }
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Create invitation link that goes to your custom auth page with invitation parameters
    const inviteLink = `https://chore-flow-collective.lovable.app/auth?invite_email=${encodeURIComponent(inviteEmail)}&household_id=${householdId}`;

    const emailResponse = await resend.emails.send({
      from: "Flatmate Flow <invite@flatmateflow.uk>",
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
            <a href="${inviteLink}" 
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

    return new Response(JSON.stringify({ 
      success: true, 
      data: emailResponse,
      userExists: !!userProfile,
      message: userProfile ? "User added to household and email sent" : "Invitation sent to new user"
    }), {
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
