import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useSupabaseRealtime() {
  const [recordCount, setRecordCount] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase.from('businesses').select('*', { count: 'exact', head: true });
      if (count !== null) setRecordCount(count);
    };
    void fetchCount();

    const businessesSubscription = supabase
      .channel('businesses_count_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'businesses' }, () => {
        setRecordCount((prev) => prev + 1);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'businesses' }, () => {
        setRecordCount((prev) => Math.max(0, prev - 1));
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(businessesSubscription);
    };
  }, []);

  return { recordCount };
}
