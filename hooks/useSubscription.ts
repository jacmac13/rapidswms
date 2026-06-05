'use client';
import { useEffect, useState } from 'react';
import type { Subscription } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { useUser } from './useUser';

export function useSubscription() {
  const { user } = useUser();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        setSubscription(data as Subscription | null);
        setLoading(false);
      });
  }, [user, supabase]);

  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  return { subscription, loading, isActive };
}
