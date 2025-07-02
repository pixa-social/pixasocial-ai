import { supabase } from './supabaseClient';
import { ContentLibraryAsset } from '../types';

// Fetch all assets for the current user from Supabase
export const fetchContentLibraryAssets = async (): Promise<ContentLibraryAsset[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('content_library_assets')
    .select('*')
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false });

  if (error) {
    console.error('Error fetching content library assets:', error);
    throw new Error('Failed to fetch assets from backend');
  }

  // For each asset, get the signed URL for the file
  const assetsWithUrls = await Promise.all(data.map(async (asset) => {
    const { data: urlData, error } = await supabase.storage
      .from('content-library')
      .createSignedUrl(asset.storage_path, 60 * 60); // URL valid for 1 hour

    if (error) {
      console.error(`Error generating signed URL for ${asset.storage_path}:`, error);
      return { ...asset, dataUrl: '' };
    }

    return { ...asset, dataUrl: urlData.signedUrl };
  }));

  return assetsWithUrls;
};

// Upload a new asset to Supabase Storage and record it in the database
export const uploadContentLibraryAsset = async (file: File, name: string, tags: string[]): Promise<ContentLibraryAsset> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Create a unique file path in storage
  const fileExtension = file.name.split('.').pop();
  const storagePath = `${user.id}/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExtension}`;

  // Upload file to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('content-library')
    .upload(storagePath, file);

  if (uploadError || !uploadData) {
    console.error('Error uploading file to Supabase Storage:', uploadError);
    throw new Error('Failed to upload file to storage');
  }

  // Insert asset record into database
  const assetData = {
    user_id: user.id,
    name,
    type: file.type.startsWith('image/') ? 'image' : 'video',
    storage_path: storagePath,
    file_name: file.name,
    file_type: file.type,
    size: file.size,
    tags,
    uploaded_at: new Date().toISOString(),
  };

  const { data: insertedAsset, error: insertError } = await supabase
    .from('content_library_assets')
    .insert([assetData])
    .select()
    .single();

  if (insertError) {
    console.error('Error inserting asset record:', insertError);
    // Rollback the file upload if database insertion fails
    await supabase.storage.from('content-library').remove([storagePath]);
    throw new Error('Failed to save asset metadata');
  }

  // Generate a signed URL for the uploaded file
  const { data: urlData, error: urlError } = await supabase.storage
    .from('content-library')
    .createSignedUrl(storagePath, 60 * 60);

  if (urlError) {
    console.error('Error generating signed URL:', urlError);
    return { ...insertedAsset, dataUrl: '' };
  }

  return { ...insertedAsset, dataUrl: urlData.signedUrl };
};

// Delete an asset from Supabase Storage and database
export const deleteContentLibraryAsset = async (assetId: string): Promise<void> => {
  // First, get the asset to retrieve the storage path
  const { data: asset, error } = await supabase
    .from('content_library_assets')
    .select('storage_path')
    .eq('id', assetId)
    .single();

  if (error) {
    console.error('Error fetching asset for deletion:', error);
    throw new Error('Failed to retrieve asset details');
  }

  if (!asset) {
    throw new Error('Asset not found');
  }

  // Delete the file from storage
  const { error: storageError } = await supabase.storage
    .from('content-library')
    .remove([asset.storage_path]);

  if (storageError) {
    console.error('Error deleting file from storage:', storageError);
    throw new Error('Failed to delete file from storage');
  }

  // Delete the database record
  const { error: deleteError } = await supabase
    .from('content_library_assets')
    .delete()
    .eq('id', assetId);

  if (deleteError) {
    console.error('Error deleting asset record:', deleteError);
    throw new Error('Failed to delete asset record');
  }
};

// Update asset tags
export const updateContentLibraryAssetTags = async (assetId: string, tags: string[]): Promise<void> => {
  const { error } = await supabase
    .from('content_library_assets')
    .update({ tags })
    .eq('id', assetId);

  if (error) {
    console.error('Error updating asset tags:', error);
    throw new Error('Failed to update asset tags');
  }
};
