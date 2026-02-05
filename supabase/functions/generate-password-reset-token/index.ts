import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = await req.json()
    
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Generate a reset token
    const token = crypto.randomUUID()
    const tokenHash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(token)
    ).then(hash => Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join(''))

    // Get user
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email)
    
    if (userError || !user.user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404
        }
      )
    }

    // Store token in database
    const { error: dbError } = await supabaseAdmin
      .from('password_reset_tokens')
      .insert({
        user_id: user.user.id,
        token: token,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      })

    if (dbError) {
      throw dbError
    }

    // Return the token (in production, you would send it via email)
    return new Response(
      JSON.stringify({ 
        token: token,
        reset_url: `${Deno.env.get('APP_URL') || 'http://localhost:3000'}/reset-password?token=${token}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    )
  }
})