import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface QuoteConfirmationRequest {
  quote_request_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError?.message);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { quote_request_id }: QuoteConfirmationRequest = await req.json();

    if (!quote_request_id) {
      return new Response(
        JSON.stringify({ error: "quote_request_id is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Processing quote confirmation for request ${quote_request_id.substring(0, 8)}...`);

    // Fetch quote request details
    const { data: quoteData, error: quoteError } = await supabaseAdmin
      .from('quote_requests')
      .select(`
        id,
        subject,
        message,
        quantity,
        product_specifications,
        user_id,
        products (name, category)
      `)
      .eq('id', quote_request_id)
      .single();

    if (quoteError || !quoteData) {
      console.error('Quote fetch error:', quoteError?.message);
      return new Response(
        JSON.stringify({ error: 'Quote request not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the user owns this quote request
    if (quoteData.user_id !== user.id) {
      console.error('User does not own this quote request');
      return new Response(
        JSON.stringify({ error: 'Forbidden: You do not own this quote request' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch user profile for email
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, full_name')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError?.message);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const productName = (quoteData.products as any)?.name || 'Custom Product';
    const productCategory = (quoteData.products as any)?.category || '';
    const quantity = quoteData.quantity || 1;
    const displayName = profile.full_name || 'Valued Customer';

    console.log(`Sending quote confirmation to user ${user.id.substring(0, 8)}...`);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SNSS <onboarding@resend.dev>",
        to: [profile.email],
        subject: "Quote Request Received - SNSS",
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                    <!-- Header -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #0ea5e9, #38bdf8); padding: 40px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">SNSS</h1>
                        <p style="color: #e0f2fe; margin: 10px 0 0; font-size: 14px;">Quote Request Confirmation</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                          <div style="display: inline-block; width: 60px; height: 60px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 50%; line-height: 60px;">
                            <span style="font-size: 28px;">✓</span>
                          </div>
                        </div>
                        
                        <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 22px; text-align: center;">Thank You, ${displayName}!</h2>
                        
                        <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0 0 25px; text-align: center;">
                          We have received your quote request and our team is reviewing it. 
                          You will receive an update once your request has been processed.
                        </p>
                        
                        <!-- Quote Details -->
                        <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin: 25px 0; border: 1px solid #e2e8f0;">
                          <h3 style="color: #1e293b; margin: 0 0 15px; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
                            📋 Quote Request Details
                          </h3>
                          
                          <table width="100%" style="font-size: 14px;">
                            <tr>
                              <td style="color: #64748b; padding: 8px 0; width: 120px;">Subject:</td>
                              <td style="color: #1e293b; padding: 8px 0; font-weight: 500;">${quoteData.subject}</td>
                            </tr>
                            <tr>
                              <td style="color: #64748b; padding: 8px 0;">Product:</td>
                              <td style="color: #1e293b; padding: 8px 0; font-weight: 500;">${productName}</td>
                            </tr>
                            ${productCategory ? `
                            <tr>
                              <td style="color: #64748b; padding: 8px 0;">Category:</td>
                              <td style="color: #1e293b; padding: 8px 0; text-transform: capitalize;">${productCategory}</td>
                            </tr>
                            ` : ''}
                            <tr>
                              <td style="color: #64748b; padding: 8px 0;">Quantity:</td>
                              <td style="color: #1e293b; padding: 8px 0; font-weight: 500;">${quantity}</td>
                            </tr>
                            ${quoteData.product_specifications ? `
                            <tr>
                              <td style="color: #64748b; padding: 8px 0; vertical-align: top;">Specifications:</td>
                              <td style="color: #1e293b; padding: 8px 0;">${quoteData.product_specifications}</td>
                            </tr>
                            ` : ''}
                          </table>
                        </div>
                        
                        <div style="background: linear-gradient(135deg, #fef3c7, #fef9c3); border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                          <p style="color: #92400e; font-size: 14px; margin: 0;">
                            <strong>What's Next?</strong><br>
                            Our team will review your request and get back to you with a detailed quote. 
                            You can track the status of your request from your dashboard.
                          </p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="https://SNSS.lovable.app/dashboard" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #0284c7); color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                            View Dashboard
                          </a>
                        </div>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 25px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                          © 2024 SNSS. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await res.json();
    
    if (!res.ok) {
      console.error("Email API error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }
    
    console.log("Quote confirmation email sent successfully");

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-quote-confirmation function:", error.message);
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
