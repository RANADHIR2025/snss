import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, Trash2, Image as ImageIcon, GripVertical } from 'lucide-react';

interface Banner {
  id: string;
  image_url: string;
  display_order: number;
}

export function AboutBannerUploader() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    const { data, error } = await supabase
      .from('about_banners')
      .select('id, image_url, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (!error && data) {
      setBanners(data);
    }
    setLoading(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const user = (await supabase.auth.getUser()).data.user;
      const newBanners: Banner[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast({ title: 'Error', description: `${file.name} is not an image file`, variant: 'destructive' });
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({ title: 'Error', description: `${file.name} exceeds 5MB limit`, variant: 'destructive' });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `about-banner-${Date.now()}-${i}.${fileExt}`;
        const filePath = `banners/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('site-assets')
          .upload(filePath, file, { upsert: true });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('site-assets')
          .getPublicUrl(filePath);

        // Insert into database
        const nextOrder = banners.length + newBanners.length;
        const { data: insertedBanner, error: insertError } = await supabase
          .from('about_banners')
          .insert({
            image_url: publicUrl,
            display_order: nextOrder,
            uploaded_by: user?.id
          })
          .select('id, image_url, display_order')
          .single();

        if (!insertError && insertedBanner) {
          newBanners.push(insertedBanner);
        }
      }

      if (newBanners.length > 0) {
        setBanners([...banners, ...newBanners]);
        toast({ 
          title: 'Success', 
          description: `${newBanners.length} banner${newBanners.length > 1 ? 's' : ''} uploaded successfully` 
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to upload images', variant: 'destructive' });
    }

    setUploading(false);
    event.target.value = '';
  };

  const handleRemoveBanner = async (bannerId: string) => {
    setDeletingId(bannerId);

    try {
      const { error } = await supabase
        .from('about_banners')
        .delete()
        .eq('id', bannerId);

      if (error) throw error;

      const updatedBanners = banners.filter(b => b.id !== bannerId);
      setBanners(updatedBanners);

      // Update display orders
      for (let i = 0; i < updatedBanners.length; i++) {
        await supabase
          .from('about_banners')
          .update({ display_order: i })
          .eq('id', updatedBanners[i].id);
      }

      toast({ title: 'Success', description: 'Banner removed' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to remove banner', variant: 'destructive' });
    }

    setDeletingId(null);
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    
    const newBanners = [...banners];
    [newBanners[index - 1], newBanners[index]] = [newBanners[index], newBanners[index - 1]];
    
    // Update orders in database
    await Promise.all([
      supabase.from('about_banners').update({ display_order: index - 1 }).eq('id', newBanners[index - 1].id),
      supabase.from('about_banners').update({ display_order: index }).eq('id', newBanners[index].id)
    ]);
    
    setBanners(newBanners);
  };

  const handleMoveDown = async (index: number) => {
    if (index === banners.length - 1) return;
    
    const newBanners = [...banners];
    [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
    
    // Update orders in database
    await Promise.all([
      supabase.from('about_banners').update({ display_order: index }).eq('id', newBanners[index].id),
      supabase.from('about_banners').update({ display_order: index + 1 }).eq('id', newBanners[index + 1].id)
    ]);
    
    setBanners(newBanners);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-card border border-border/50 p-6">
      <div className="flex items-center gap-3 mb-4">
        <ImageIcon className="w-6 h-6 text-primary" />
        <h3 className="font-display text-lg font-semibold text-foreground">About Section Banners</h3>
      </div>
      
      <p className="text-sm text-muted-foreground mb-4">
        Upload multiple images to display in the About section. 
        Single image shows static, multiple images auto-rotate as a carousel.
      </p>

      {/* Banner List */}
      {banners.length > 0 && (
        <div className="space-y-3 mb-6">
          {banners.map((banner, index) => (
            <div 
              key={banner.id}
              className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border/50"
            >
              <div className="flex flex-col gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                >
                  <GripVertical className="w-4 h-4 rotate-90" />
                </Button>
              </div>
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-border flex-shrink-0">
                <img 
                  src={banner.image_url} 
                  alt={`Banner ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Banner {index + 1}</p>
                <p className="text-xs text-muted-foreground truncate">{banner.image_url.split('/').pop()}</p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="text-xs"
                >
                  ↑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleMoveDown(index)}
                  disabled={index === banners.length - 1}
                  className="text-xs"
                >
                  ↓
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleRemoveBanner(banner.id)}
                  disabled={deletingId === banner.id}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {deletingId === banner.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
        {banners.length === 0 && (
          <>
            <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">No banners uploaded. The default display will be shown.</p>
          </>
        )}
        <Label htmlFor="banner-upload" className="cursor-pointer">
          <Input
            id="banner-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <Button disabled={uploading} asChild>
            <span>
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              {banners.length > 0 ? 'Add More Banners' : 'Upload Banners'}
            </span>
          </Button>
        </Label>
        <p className="text-xs text-muted-foreground mt-2">
          Max 5MB per image. Supports JPG, PNG, WebP.
        </p>
      </div>

      {banners.length > 1 && (
        <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm text-primary">
            ✨ Carousel mode active with {banners.length} images. Images will auto-rotate every 4 seconds.
          </p>
        </div>
      )}
    </div>
  );
}
