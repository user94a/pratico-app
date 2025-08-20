import { useState } from 'react'
import { Database } from '../database.types'
import { supabase } from '../supabase'

type Asset = Database['public']['Tables']['assets']['Row']

interface CreateAssetWithTemplatesInput {
  name: string
  type: 'vehicles' | 'properties' | 'animals' | 'people' | 'devices' | 'subscriptions' | 'other'
  identifier?: string
  custom_icon?: string
}

interface CreateAssetWithTemplatesResponse {
  asset: Asset
  deadlines_created: number
}

export function useCreateAssetWithTemplates() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createAsset = async (input: CreateAssetWithTemplatesInput) => {
    try {
      setIsLoading(true)
      setError(null)

      console.log('Creating asset with input:', input)

      // Ora usiamo direttamente le nuove categorie
      const dbType = input.type;

      console.log('Using DB type:', dbType)

      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .insert({
          name: input.name,
          type: dbType,
          identifier: input.identifier || null,
          custom_icon: input.custom_icon || null
        })
        .select()
        .single()

      console.log('Supabase response:', { asset, error: assetError })

      if (assetError) {
        console.error('Asset creation error details:', assetError)
        throw new Error(`Errore database: ${assetError.message}`)
      }

      if (!asset) {
        throw new Error('Nessun asset restituito dal database')
      }

      console.log('Asset creato con successo:', asset)

      return {
        asset,
        deadlines_created: 0
      } as CreateAssetWithTemplatesResponse

    } catch (err) {
      console.error('Full error:', err)
      const message = err instanceof Error ? err.message : 'Errore sconosciuto nella creazione dell\'asset'
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  return {
    createAsset,
    isLoading,
    error
  }
} 