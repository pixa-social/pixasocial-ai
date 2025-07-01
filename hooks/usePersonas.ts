import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { Persona, RSTProfile } from '../types'

export function usePersonas() {
  const { user } = useAuth()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchPersonas()
    } else {
      setPersonas([])
      setLoading(false)
    }
  }, [user])

  const fetchPersonas = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('personas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const transformedPersonas: Persona[] = data.map(row => ({
        id: row.id,
        name: row.name,
        demographics: row.demographics,
        psychographics: row.psychographics,
        initialBeliefs: row.initial_beliefs,
        vulnerabilities: row.vulnerabilities,
        avatarUrl: row.avatar_url || undefined,
        rstProfile: {
          bas: row.rst_profile_bas,
          bis: row.rst_profile_bis,
          fffs: row.rst_profile_fffs,
        } as RSTProfile,
      }))

      setPersonas(transformedPersonas)
    } catch (error) {
      console.error('Error fetching personas:', error)
    } finally {
      setLoading(false)
    }
  }

  const addPersona = async (persona: Omit<Persona, 'id'>) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('personas')
        .insert({
          user_id: user.id,
          name: persona.name,
          demographics: persona.demographics,
          psychographics: persona.psychographics,
          initial_beliefs: persona.initialBeliefs,
          vulnerabilities: persona.vulnerabilities || [],
          avatar_url: persona.avatarUrl,
          rst_profile_bas: persona.rstProfile?.bas || 'Not Assessed',
          rst_profile_bis: persona.rstProfile?.bis || 'Not Assessed',
          rst_profile_fffs: persona.rstProfile?.fffs || 'Not Assessed',
        })
        .select()
        .single()

      if (error) throw error

      const newPersona: Persona = {
        id: data.id,
        name: data.name,
        demographics: data.demographics,
        psychographics: data.psychographics,
        initialBeliefs: data.initial_beliefs,
        vulnerabilities: data.vulnerabilities,
        avatarUrl: data.avatar_url || undefined,
        rstProfile: {
          bas: data.rst_profile_bas,
          bis: data.rst_profile_bis,
          fffs: data.rst_profile_fffs,
        } as RSTProfile,
      }

      setPersonas(prev => [newPersona, ...prev])
      return newPersona
    } catch (error) {
      console.error('Error adding persona:', error)
      throw error
    }
  }

  const updatePersona = async (persona: Persona) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('personas')
        .update({
          name: persona.name,
          demographics: persona.demographics,
          psychographics: persona.psychographics,
          initial_beliefs: persona.initialBeliefs,
          vulnerabilities: persona.vulnerabilities || [],
          avatar_url: persona.avatarUrl,
          rst_profile_bas: persona.rstProfile?.bas || 'Not Assessed',
          rst_profile_bis: persona.rstProfile?.bis || 'Not Assessed',
          rst_profile_fffs: persona.rstProfile?.fffs || 'Not Assessed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', persona.id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error

      const updatedPersona: Persona = {
        id: data.id,
        name: data.name,
        demographics: data.demographics,
        psychographics: data.psychographics,
        initialBeliefs: data.initial_beliefs,
        vulnerabilities: data.vulnerabilities,
        avatarUrl: data.avatar_url || undefined,
        rstProfile: {
          bas: data.rst_profile_bas,
          bis: data.rst_profile_bis,
          fffs: data.rst_profile_fffs,
        } as RSTProfile,
      }

      setPersonas(prev => prev.map(p => p.id === persona.id ? updatedPersona : p))
      return updatedPersona
    } catch (error) {
      console.error('Error updating persona:', error)
      throw error
    }
  }

  const deletePersona = async (personaId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('personas')
        .delete()
        .eq('id', personaId)
        .eq('user_id', user.id)

      if (error) throw error

      setPersonas(prev => prev.filter(p => p.id !== personaId))
    } catch (error) {
      console.error('Error deleting persona:', error)
      throw error
    }
  }

  return {
    personas,
    loading,
    addPersona,
    updatePersona,
    deletePersona,
    refetch: fetchPersonas,
  }
}