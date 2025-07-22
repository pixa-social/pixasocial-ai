// services/dataService.ts
import { supabase } from './supabaseClient';
import type { PostgrestError } from '@supabase/supabase-js';

/**
 * This service module centralizes all direct database operations, particularly deletions.
 * By decoupling database logic from React hooks and component state, we ensure that
 * operations are more robust, predictable, and easier to debug. Each function here
 * is a self-contained async operation that interacts directly with Supabase.
 */

async function handleDelete(tableName: string, id: string | number): Promise<{ error: PostgrestError | null }> {
    const { error } = await supabase.from(tableName).delete().eq('id', id);
    return { error };
}

export const deletePersona = (id: number) => handleDelete('personas', id);
export const deleteOperator = (id: number) => handleDelete('operators', id);
export const deleteContentDraft = (id: string) => handleDelete('content_drafts', id);
export const deleteScheduledPost = (id: number) => handleDelete('scheduled_posts', id);
export const deleteConnectedAccount = (id: string) => handleDelete('connected_accounts', id);

/**
 * Deletes a content library asset from both storage and the database.
 * @param assetId The UUID of the asset's database record.
 * @param storagePath The full path of the asset in Supabase Storage.
 * @returns An object containing a potential error.
 */
export async function deleteContentLibraryAsset(assetId: string, storagePath: string): Promise<{ error: PostgrestError | Error | null }> {
    try {
        // 1. Attempt to remove the file from Supabase Storage.
        const { error: storageError } = await supabase.storage
            .from('content-library')
            .remove([storagePath]);
        
        // A "Not Found" error from storage is not critical, as the goal is to have it gone.
        // We can log other errors but still proceed to ensure the DB record is deleted.
        if (storageError && storageError.message !== 'The resource was not found') {
            console.warn(`Could not remove file from storage (path: ${storagePath}), but proceeding to delete database record. Error: ${storageError.message}`);
        }

        // 2. Delete the record from the database table. This is the critical step.
        const { error: dbError } = await supabase
            .from('content_library_assets')
            .delete()
            .eq('id', assetId);

        if (dbError) {
            throw dbError;
        }

        return { error: null }; // Success

    } catch (error) {
        console.error("Error in deleteContentLibraryAsset service:", error);
        return { error: error as PostgrestError };
    }
}

/**
 * Deletes a chat session and all its associated messages by calling a secure RPC function.
 * @param sessionId The UUID of the chat session to delete.
 * @returns An object containing a potential error.
 */
export async function deleteChatSession(sessionId: string): Promise<{ error: PostgrestError | null }> {
    const { error } = await supabase.rpc('delete_chat_session', {
        session_id_to_delete: sessionId
    });
    return { error };
}
