import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AboutBanner {
  id: string;
  image_url: string;
  display_order: number;
}

export function useAboutBanners() {
  const [banners, setBanners] = useState<AboutBanner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

    fetchBanners();
  }, []);

  return { banners, loading };
}
