import { supabase } from './supabaseClient';
import { Persona } from '../types';

export const fetchPersonas = async (): Promise<Persona[]> => {
  try {
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching personas:', error);
      throw new Error('Failed to fetch personas from Pixasocial.');
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching personas:', error);
    throw error;
  }
};

export const savePersona = async (persona: Omit<Persona, 'id' | 'avatarUrl'> & { vulnerabilities?: string[]; rstProfile?: any }): Promise<Persona> => {
  try {
    const { vulnerabilities, rstProfile, initialBeliefs, ...rest } = persona;
    // Fetch the current authenticated user's ID
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error fetching user data:', userError);
      throw new Error('Failed to get user data for persona creation.');
    }
    const userId = userData?.user?.id;
    if (!userId) {
      throw new Error('No authenticated user found for persona creation.');
    }

    const personaData = {
      ...rest,
      user_id: userId, // Explicitly set the user_id field
      initial_beliefs: initialBeliefs || '', // Match Supabase schema field name
      vulnerabilities: vulnerabilities || [],
      avatar_url: '', // Explicitly set to empty string since it's nullable
      rst_profile_bas: rstProfile?.bas || 'Not Assessed',
      rst_profile_bis: rstProfile?.bis || 'Not Assessed',
      rst_profile_fffs: rstProfile?.fffs || 'Not Assessed',
    };

    console.log('Saving persona with data:', personaData); // Debug log to inspect data before insertion

    const { data, error } = await supabase
      .from('personas')
      .insert([personaData])
      .select()
      .single();

    if (error) {
      console.error('Error saving persona - Detailed Supabase error:', error.message, error.details, error.hint, error.code);
      throw new Error(`Failed to save persona to Pixasocial: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error saving persona:', error);
    throw new Error(`Failed to create persona: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const updatePersona = async (id: string, persona: Partial<Persona> & { vulnerabilities?: string[]; rstProfile?: any }): Promise<Persona> => {
  try {
    const { vulnerabilities, rstProfile, initialBeliefs, ...rest } = persona;
    const personaData = {
      ...rest,
      initial_beliefs: initialBeliefs || '', // Match Supabase schema field name
      vulnerabilities: vulnerabilities || [],
      rst_profile_bas: rstProfile?.bas || 'Not Assessed',
      rst_profile_bis: rstProfile?.bis || 'Not Assessed',
      rst_profile_fffs: rstProfile?.fffs || 'Not Assessed',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('personas')
      .update(personaData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating persona:', error);
      throw new Error('Failed to update persona on Pixasocial.');
    }

    return data;
  } catch (error) {
    console.error('Error updating persona:', error);
    throw error;
  }
};

export const deletePersona = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('personas')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting persona:', error);
      throw new Error('Failed to delete persona from Pixasocial.');
    }
  } catch (error) {
    console.error('Error deleting persona:', error);
    throw error;
  }
};

export const importPersonasFromJson = async (jsonData: any[]): Promise<Persona[]> => {
  try {
    // Fetch the current authenticated user's ID
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error fetching user data for import:', userError);
      throw new Error('Failed to get user data for persona import.');
    }
    const userId = userData?.user?.id;
    if (!userId) {
      throw new Error('No authenticated user found for persona import.');
    }

    const personasToInsert = jsonData.map(persona => {
      const { vulnerabilities, rstProfile, initialBeliefs, avatarUrl, ...rest } = persona;
      return {
        ...rest,
        user_id: userId, // Explicitly set the user_id field
        initial_beliefs: initialBeliefs || '',
        vulnerabilities: vulnerabilities || [],
        avatar_url: avatarUrl || '',
        rst_profile_bas: rstProfile?.bas || 'Not Assessed',
        rst_profile_bis: rstProfile?.bis || 'Not Assessed',
        rst_profile_fffs: rstProfile?.fffs || 'Not Assessed',
      };
    });

    const { data, error } = await supabase
      .from('personas')
      .insert(personasToInsert)
      .select();

    if (error) {
      console.error('Error importing personas:', error);
      throw new Error(`Failed to import personas to Pixasocial: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error importing personas:', error);
    throw new Error(`Failed to import personas: ${error instanceof Error ? error.message : String(error)}`);
  }
};
