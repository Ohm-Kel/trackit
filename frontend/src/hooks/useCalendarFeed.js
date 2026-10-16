import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchCalendarFeed, createCalendarFeed, revokeCalendarFeed } from '../api/calendar';
import { useAuth } from '../context/AuthContext';

const key = (userId) => ['calendarFeed', userId];

export function useCalendarFeed() {
  const { user } = useAuth();
  return useQuery({
    queryKey: key(user?.id),
    queryFn: fetchCalendarFeed,
    enabled: !!user,
  });
}

/** Create or rotate the link. The new token is in the mutation's result only. */
export function useCreateCalendarFeed() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: createCalendarFeed,
    onSuccess: ({ created_at }) =>
      queryClient.setQueryData(key(user?.id), { active: true, created_at }),
  });
}

export function useRevokeCalendarFeed() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: revokeCalendarFeed,
    onSuccess: () => queryClient.setQueryData(key(user?.id), { active: false, created_at: null }),
  });
}
