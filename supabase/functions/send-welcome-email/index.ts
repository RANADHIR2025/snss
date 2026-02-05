import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  user_id: string;
  email: string;
  full_name: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, email, full_name }: WelcomeEmailRequest = await req.json();

    // Input validation
    if (!user_id || !email) {
      console.log("Missing required fields: user_id or email");
      return new Response(
        JSON.stringify({ error: "user_id and email are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log("Invalid email format provided");
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Sending welcome email for user ${user_id.substring(0, 8)}...`);

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const displayName = full_name || "Valued Customer";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SNSS <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to SNSS! 🎉",
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
                      <td style="background: linear-gradient(135deg, #0ea5e9, #38bdf8); padding: 50px 40px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">Welcome to SNSS!</h1>
                        <p style="color: #e0f2fe; margin: 10px 0 0; font-size: 16px;">Your journey to quality products starts here</p>
                      </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                      <td style="padding: 40px;">
                        <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 22px;">Hello, ${displayName}!</h2>
                        
                        <p style="color: #64748b; font-size: 16px; line-height: 1.8; margin: 0 0 25px;">
                          Thank you for joining SNSS! We're thrilled to have you as part of our community. 
                          Your account has been successfully created and you're now ready to explore our wide range of products.
                        </p>
                        
                        <div style="background: linear-gradient(135deg, #f0f9ff, #e0f2fe); border-radius: 12px; padding: 25px; margin: 25px 0;">
                          <h3 style="color: #0369a1; margin: 0 0 15px; font-size: 18px;">What You Can Do Now:</h3>
                          <ul style="color: #0c4a6e; margin: 0; padding-left: 20px; line-height: 2;">
                            <li>Browse our extensive product catalog</li>
                            <li>Add products to your quote cart</li>
                            <li>Submit quote requests for personalized pricing</li>
                            <li>Track the status of your requests</li>
                            <li>Receive updates on your quotes</li>
                          </ul>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                          <a href="https://SNSS.lovable.app/products" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9, #0284c7); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                            Start Exploring Products
                          </a>
                        </div>
                        
                        <p style="color: #64748b; font-size: 14px; line-height: 1.6; margin: 25px 0 0; text-align: center;">
                          If you have any questions or need assistance, our team is always here to help.
                        </p>
                      </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                      <td style="padding: 30px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="color: #64748b; font-size: 14px; margin: 0 0 10px;">
                          Thank you for choosing SNSS!
                        </p>
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
    
    console.log("Welcome email sent successfully");

    return new Response(JSON.stringify({ success: true, data: emailData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-welcome-email function:", error.message);
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
