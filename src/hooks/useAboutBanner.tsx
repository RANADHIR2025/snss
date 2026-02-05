import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAboutBanner() {
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanner = async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'about_banner')
        .single();

      if (!error && data?.value) {
        setBannerUrl(data.value);
      }
      setLoading(false);
    };

    fetchBanner();
  }, []);

  return { bannerUrl, loading };
}
