import { supabase } from './supabaseClient';
import { Operator } from '../types';

export const fetchOperators = async (): Promise<Operator[]> => {
  try {
    const { data, error } = await supabase
      .from('operator_builder')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching operators:', error.message, error.details);
      throw new Error('Failed to fetch operators from Pixasocial.');
    }

    // Map the configuration JSONB back to Operator type if necessary
    return data.map(item => ({
      id: item.id,
      name: item.name,
      targetAudienceId: item.configuration?.targetAudienceId || '',
      type: item.configuration?.type || 'Custom',
      conditionedStimulus: item.configuration?.conditionedStimulus || '',
      unconditionedStimulus: item.configuration?.unconditionedStimulus || '',
      desiredConditionedResponse: item.configuration?.desiredConditionedResponse || '',
      reinforcementLoop: item.configuration?.reinforcementLoop || '',
    })) || [];
  } catch (error) {
    console.error('Error fetching operators:', error);
    throw error;
  }
};

export const saveOperator = async (operator: Omit<Operator, 'id'>): Promise<Operator> => {
  try {
    // Fetch the current user's ID from Supabase auth
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error('Error fetching user data:', userError.message);
      throw new Error('Failed to fetch user data for operator creation.');
    }
    const userId = userData.user.id;

    // Map operator fields into configuration JSONB
    const configuration = {
      targetAudienceId: operator.targetAudienceId,
      type: operator.type,
      conditionedStimulus: operator.conditionedStimulus,
      unconditionedStimulus: operator.unconditionedStimulus,
      desiredConditionedResponse: operator.desiredConditionedResponse,
      reinforcementLoop: operator.reinforcementLoop,
    };

    const operatorData = {
      user_id: userId,
      name: operator.name,
      configuration: configuration,
    };

    const { data, error } = await supabase
      .from('operator_builder')
      .insert([operatorData])
      .select()
      .single();

    if (error) {
      console.error('Error saving operator:', error.message, error.details);
      throw new Error('Failed to save operator to Pixasocial.');
    }

    return {
      id: data.id,
      name: data.name,
      targetAudienceId: data.configuration.targetAudienceId,
      type: data.configuration.type,
      conditionedStimulus: data.configuration.conditionedStimulus,
      unconditionedStimulus: data.configuration.unconditionedStimulus,
      desiredConditionedResponse: data.configuration.desiredConditionedResponse,
      reinforcementLoop: data.configuration.reinforcementLoop,
    };
  } catch (error) {
    console.error('Error saving operator:', error);
    throw error;
  }
};

export const updateOperator = async (id: string, operator: Partial<Operator>): Promise<Operator> => {
  try {
    // Map operator fields into configuration JSONB
    const configuration = {
      targetAudienceId: operator.targetAudienceId,
      type: operator.type,
      conditionedStimulus: operator.conditionedStimulus,
      unconditionedStimulus: operator.unconditionedStimulus,
      desiredConditionedResponse: operator.desiredConditionedResponse,
      reinforcementLoop: operator.reinforcementLoop,
    };

    const operatorData = {
      name: operator.name,
      configuration: configuration,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('operator_builder')
      .update(operatorData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating operator:', error.message, error.details);
      throw new Error('Failed to update operator on Pixasocial.');
    }

    return {
      id: data.id,
      name: data.name,
      targetAudienceId: data.configuration.targetAudienceId,
      type: data.configuration.type,
      conditionedStimulus: data.configuration.conditionedStimulus,
      unconditionedStimulus: data.configuration.unconditionedStimulus,
      desiredConditionedResponse: data.configuration.desiredConditionedResponse,
      reinforcementLoop: data.configuration.reinforcementLoop,
    };
  } catch (error) {
    console.error('Error updating operator:', error);
    throw error;
  }
};

export const deleteOperator = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('operator_builder')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting operator:', error.message, error.details);
      throw new Error('Failed to delete operator from Pixasocial.');
    }
  } catch (error) {
    console.error('Error deleting operator:', error);
    throw error;
  }
};
