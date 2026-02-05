import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusNotificationRequest {
  quote_request_id: string;
  status: string;
}

const getStatusMessage = (status: string) => {
  switch (status) {
    case 'approved':
      return {
        subject: 'Your Quote Request Has Been Approved!',
        heading: 'Great News!',
        message: 'Your quote request has been approved. Our team will be in touch with you shortly to discuss the next steps.',
        color: '#22c55e',
        whatsappText: '✅ *Great News!* Your quote request has been *APPROVED*! Our team will contact you shortly to discuss the next steps.'
      };
    case 'rejected':
      return {
        subject: 'Update on Your Quote Request',
        heading: 'Quote Request Update',
        message: 'Unfortunately, we are unable to proceed with your quote request at this time. Please feel free to submit a new request or contact us for more information.',
        color: '#ef4444',
        whatsappText: '❌ *Quote Request Update*: Unfortunately, we are unable to proceed with your quote request at this time. Feel free to submit a new request or contact us for more information.'
      };
    default:
      return {
        subject: 'Your Quote Request is Being Reviewed',
        heading: 'Request Received',
        message: 'Your quote request is currently being reviewed by our team. We will update you once a decision has been made.',
        color: '#f59e0b',
        whatsappText: '⏳ *Request Received*: Your quote request is being reviewed by our team. We will update you once a decision has been made.'
      };
  }
};

// Helper to mask PII for logging
const maskEmail = (email: string): string => {
  if (!email) return '[no email]';
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return '[invalid email]';
  return `${localPart.substring(0, 2)}***@${domain}`;
};

const maskPhone = (phone: string | null): string => {
  if (!phone) return '[no phone]';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '[invalid phone]';
  return `***${cleaned.slice(-4)}`;
};

const sendWhatsAppMessage = async (phone: string, message: string) => {
  // Clean the phone number - remove spaces, dashes, and ensure it starts with country code
  let cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // If phone doesn't start with +, assume it's an Indian number
  if (!cleanPhone.startsWith('+')) {
    // Remove leading 0 if present
    if (cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.substring(1);
    }
    // Add India country code if not present
    if (!cleanPhone.startsWith('91')) {
      cleanPhone = '91' + cleanPhone;
    }
  } else {
    cleanPhone = cleanPhone.substring(1); // Remove the + for WhatsApp API
  }

  // Create WhatsApp URL - this opens WhatsApp with pre-filled message
  // Note: This is for WhatsApp Web/Click-to-Chat - for full automation you'd need WhatsApp Business API
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  
  console.log(`WhatsApp notification prepared for phone ending in ${cleanPhone.slice(-4)}`);
  
  return {
    success: true,
    whatsappUrl,
    phone: cleanPhone
  };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify JWT and check admin role
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
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if user has admin role
    const { data: adminRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (roleError || !adminRole) {
      console.error('Role check failed:', roleError);
      return new Response(
        JSON.stringify({ error: 'Forbidden: Admin access required' }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Parse request - now we only accept quote_request_id and status
    const { quote_request_id, status }: StatusNotificationRequest = await req.json();
    
    if (!quote_request_id) {
      return new Response(
        JSON.stringify({ error: 'quote_request_id is required' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch quote request with user profile to get email and phone
    const { data: quoteData, error: quoteError } = await supabaseAdmin
      .from('quote_requests')
      .select(`
        id,
        subject,
        quantity,
        product_id,
        products (name)
      `)
      .eq('id', quote_request_id)
      .single();

    if (quoteError || !quoteData) {
      console.error('Quote fetch error:', quoteError);
      return new Response(
        JSON.stringify({ error: 'Quote request not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get the user_id from quote_requests and fetch profile
    const { data: quoteWithUser } = await supabaseAdmin
      .from('quote_requests')
      .select('user_id')
      .eq('id', quote_request_id)
      .single();

    if (!quoteWithUser) {
      return new Response(
        JSON.stringify({ error: 'Quote request user not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch user profile for email and phone
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('email, phone')
      .eq('user_id', quoteWithUser.user_id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const email = profile.email;
    const phone = profile.phone;
    const productName = (quoteData.products as any)?.name;
    const quantity = quoteData.quantity;

    // Log with masked PII
    console.log(`Sending status notification to ${maskEmail(email)} (phone: ${maskPhone(phone)}) for status: ${status}`);

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const statusContent = getStatusMessage(status);

    // Build enhanced WhatsApp message
    let whatsappMessage = statusContent.whatsappText;
    if (productName) {
      whatsappMessage = `📦 *Product:* ${productName}\n${quantity ? `📊 *Quantity:* ${quantity}\n` : ''}\n${statusContent.whatsappText}`;
    }

    // Send email notification
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "SNSS <onboarding@resend.dev>",
        to: [email],
        subject: statusContent.subject,
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
                    <tr>
                      <td style="background: linear-gradient(135deg, #0ea5e9, #38bdf8); padding: 40px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">SNSS</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 40px;">
                        <div style="text-align: center; margin-bottom: 30px;">
                          <h2 style="color: #1e293b; margin: 0 0 20px; font-size: 24px;">${statusContent.heading}</h2>
                          ${productName ? `<p style="color: #64748b; font-size: 14px; margin: 0 0 10px;">Product: <strong>${productName}</strong>${quantity ? ` (Qty: ${quantity})` : ''}</p>` : ''}
                          <p style="color: #64748b; font-size: 16px; line-height: 1.6; margin: 0;">
                            ${statusContent.message}
                          </p>
                        </div>
                        <div style="background-color: #f1f5f9; border-radius: 12px; padding: 20px; text-align: center;">
                          <p style="color: #475569; margin: 0; font-size: 14px;">
                            Status: <strong style="color: ${statusContent.color}; text-transform: uppercase;">${status}</strong>
                          </p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 30px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
                        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                          2024 SNSS. All rights reserved.
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
    console.log("Email sent successfully for quote:", quote_request_id.substring(0, 8));

    // Handle WhatsApp notification if phone is provided
    let whatsappResult = null;
    if (phone && phone.trim()) {
      whatsappResult = await sendWhatsAppMessage(phone, whatsappMessage);
    }

    return new Response(JSON.stringify({ 
      email: emailData,
      whatsapp: whatsappResult 
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-status-notification function:", error);
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
