import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CreateAssetRequest {
  name: string
  type: 'car' | 'house' | 'other'
  identifier?: string
}

serve(async (req) => {
  try {
    console.log('=== START create-asset-with-templates ===')
    
    // Ottieni i dati dalla richiesta
    const { name, type, identifier } = await req.json() as CreateAssetRequest
    console.log('Request data:', { name, type, identifier })

    // Valida input
    if (!name || !type) {
      console.log('Validation failed: missing name or type')
      return new Response(
        JSON.stringify({ error: 'Nome e tipo sono richiesti' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Ottieni l'utente dalla JWT
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header present:', !!authHeader)
    
    if (!authHeader) {
      console.log('No auth header found')
      return new Response(
        JSON.stringify({ error: 'Non autorizzato' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Crea client Supabase con service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    console.log('Supabase URL present:', !!supabaseUrl)
    console.log('Service key present:', !!supabaseServiceKey)
    
    const supabase = createClient(supabaseUrl ?? '', supabaseServiceKey ?? '')

    // Estrai user_id dal token
    const jwt = authHeader.replace('Bearer ', '')
    console.log('JWT length:', jwt.length)
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)
    console.log('User auth result:', { user: !!user, error: userError })
    
    if (userError || !user) {
      console.log('User auth failed:', userError)
      return new Response(
        JSON.stringify({ error: 'Token non valido' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    console.log('User ID:', user.id)

    // Crea l'asset
    console.log('Creating asset...')
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .insert({
        name,
        type,
        identifier,
        user_id: user.id
      })
      .select()
      .single()

    console.log('Asset creation result:', { asset: !!asset, error: assetError })

    if (assetError) {
      console.log('Asset creation failed:', assetError)
      return new Response(
        JSON.stringify({ error: 'Errore nella creazione dell\'asset', details: assetError }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // PER ORA SALTIAMO I TEMPLATE E RESTITUIAMO SOLO L'ASSET
    console.log('=== SUCCESS - Asset created without templates ===')
    return new Response(
      JSON.stringify({ 
        asset,
        deadlines_created: 0,
        message: 'Asset creato senza template (test mode)'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.log('=== CATCH ERROR ===', error)
    return new Response(
      JSON.stringify({ error: 'Errore interno del server', details: error?.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

// Utility per convertire intervalli PostgreSQL in millisecondi
function parsePgInterval(interval: string): number {
  const multipliers: Record<string, number> = {
    years: 31536000000,   // 365 * 24 * 60 * 60 * 1000
    months: 2592000000,   // 30 * 24 * 60 * 60 * 1000
    days: 86400000,       // 24 * 60 * 60 * 1000
    hours: 3600000,       // 60 * 60 * 1000
    minutes: 60000,       // 60 * 1000
    seconds: 1000
  }

  const parts = interval.split(' ')
  let ms = 0

  for (let i = 0; i < parts.length; i += 2) {
    const value = parseInt(parts[i])
    const unit = parts[i + 1].toLowerCase()
    const unitSingular = unit.endsWith('s') ? unit.slice(0, -1) : unit

    if (multipliers[unit] || multipliers[unitSingular + 's']) {
      ms += value * (multipliers[unit] || multipliers[unitSingular + 's'])
    }
  }

  return ms
} 