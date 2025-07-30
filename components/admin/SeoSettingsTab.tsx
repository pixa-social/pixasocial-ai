import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { supabase } from '../../services/supabaseClient';
import { useToast } from '../ui/ToastProvider';
import { AuthViewType } from '../../types';
import { Input } from '../ui/Input';

// Helper to download files
const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

// Main Component
export const SeoSettingsTab: React.FC = () => {
  const { showToast } = useToast();
  const [headerScripts, setHeaderScripts] = useState('');
  const [footerScripts, setFooterScripts] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null);
  const [currentFaviconUrl, setCurrentFaviconUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const settingsId = 'a1b2c3d4-e5f6-7890-1234-567890abcdef'; // Fixed ID for single settings row

  // Fetch existing settings on mount
  useEffect(() => {
    const fetchSeoSettings = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('seo_settings')
        .select('*')
        .eq('id', settingsId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
        showToast(`Error fetching SEO settings: ${error.message}`, 'error');
      } else if (data) {
        setHeaderScripts(data.header_scripts || '');
        setFooterScripts(data.footer_scripts || '');
        setCurrentFaviconUrl(data.favicon_url);
        setFaviconPreview(data.favicon_url);
      }
      setIsLoading(false);
    };
    fetchSeoSettings();
  }, [showToast]);

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!['image/png', 'image/x-icon', 'image/svg+xml', 'image/jpeg'].includes(file.type)) {
        showToast('Invalid file type. Please use PNG, ICO, SVG, or JPG.', 'error');
        return;
      }
      if (file.size > 1 * 1024 * 1024) { // 1MB limit
        showToast('File size should not exceed 1MB.', 'error');
        return;
      }
      setFaviconFile(file);
      setFaviconPreview(URL.createObjectURL(file));
    }
  };
  
  const handleSaveFavicon = async () => {
      if (!faviconFile) {
        showToast('Please select a file to upload.', 'info');
        return;
      }
      setIsUploading(true);
      const fileExt = faviconFile.name.split('.').pop() || 'png';
      const filePath = `favicon.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('branding')
        .upload(filePath, faviconFile, {
          cacheControl: '3600',
          upsert: true, // Overwrite existing favicon
        });

      if (uploadError) {
        showToast(`Favicon upload failed: ${uploadError.message}`, 'error');
        setIsUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('seo_settings')
        .upsert({ id: settingsId, favicon_url: publicUrl, updated_at: new Date().toISOString() } as any);
      
      if (dbError) {
        showToast(`Failed to save favicon URL: ${dbError.message}`, 'error');
      } else {
        showToast('Favicon updated successfully! It will be applied on the next page load.', 'success');
        setCurrentFaviconUrl(publicUrl);
      }
      setIsUploading(false);
      setFaviconFile(null);
  };

  // Handle saving scripts to the database
  const handleSaveScripts = async () => {
    setIsSaving(true);
    const payload = {
        id: settingsId,
        header_scripts: headerScripts,
        footer_scripts: footerScripts,
        updated_at: new Date().toISOString()
    };
    const { error } = await supabase
      .from('seo_settings')
      .upsert(payload as any, { onConflict: 'id' });
      
    if (error) {
      showToast(`Error saving SEO settings: ${error.message}`, 'error');
    } else {
      showToast('SEO & Analytics scripts saved successfully. They will be applied on next page load.', 'success');
    }
    setIsSaving(false);
  };

  // Handle sitemap generation and download
  const handleGenerateSitemap = useCallback(() => {
    const publicViews: AuthViewType[] = ['home', 'features', 'pricing', 'documentation', 'about', 'contact', 'privacy', 'terms'];
    const baseUrl = window.location.origin;
    const today = new Date().toISOString().split('T')[0];

    const urls = publicViews.map(view => {
      const path = view === 'home' ? '' : `/${view}`; // Assuming view corresponds to a path
      return `
    <url>
      <loc>${baseUrl}${path}</loc>
      <lastmod>${today}</lastmod>
      <priority>${view === 'home' ? '1.00' : '0.80'}</priority>
    </url>`;
    }).join('');

    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`;

    downloadFile(sitemapContent, 'sitemap.xml', 'application/xml');
    showToast('Sitemap generated and download started.', 'success');
  }, [showToast]);


  if (isLoading) {
    return <LoadingSpinner text="Loading SEO settings..." className="mt-8" />;
  }

  return (
    <div className="mt-4 space-y-6">
       <Card title="Favicon Management">
          <p className="text-sm text-textSecondary mb-4">
            Upload a favicon for your application. Recommended size is 32x32 or 64x64 pixels. Supported formats: PNG, ICO, SVG, JPG.
          </p>
          <div className="flex items-start gap-6">
              <div className="flex-grow">
                  <Input 
                      label="Upload New Favicon"
                      type="file"
                      id="favicon-upload"
                      accept="image/png, image/x-icon, image/svg+xml, image/jpeg"
                      onChange={handleFaviconChange}
                      containerClassName="mb-0"
                  />
                   <Button onClick={handleSaveFavicon} isLoading={isUploading} disabled={!faviconFile} className="mt-4">
                      Upload & Save Favicon
                  </Button>
              </div>
              <div className="text-center">
                  <p className="text-sm font-medium text-textSecondary mb-2">Preview</p>
                  <img src={faviconPreview || 'https://via.placeholder.com/64'} alt="Favicon preview" className="w-16 h-16 rounded-md border border-border bg-card object-contain" />
              </div>
          </div>
      </Card>

      <Card title="Analytics & Tracking Scripts">
        <p className="text-sm text-textSecondary mb-4">
          Add scripts like Google Analytics, tracking pixels, or other third-party code snippets here. They will be injected into the application's HTML. Be cautious, as incorrect code can break the app.
        </p>
        <div className="space-y-4">
          <Textarea
            label="Header Scripts (in <head>)"
            value={headerScripts}
            onChange={(e) => setHeaderScripts(e.target.value)}
            placeholder="<!-- Scripts to add to the <head> tag -->"
            rows={6}
            className="font-mono text-xs"
          />
          <Textarea
            label="Footer Scripts (before </body>)"
            value={footerScripts}
            onChange={(e) => setFooterScripts(e.target.value)}
            placeholder="<!-- Scripts to add before the closing </body> tag -->"
            rows={6}
            className="font-mono text-xs"
          />
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveScripts} isLoading={isSaving}>
            Save Scripts
          </Button>
        </div>
      </Card>
      
      <Card title="Sitemap Management">
        <p className="text-sm text-textSecondary mb-4">
          Generate a `sitemap.xml` file for your application's public pages. This helps search engines like Google discover and index your site's content.
        </p>
        <Button onClick={handleGenerateSitemap} variant="secondary">
          Generate and Download sitemap.xml
        </Button>
      </Card>
    </div>
  );
};