import { useQuery } from "@tanstack/react-query";
import { getBarberByUserId, listBarberAppointments } from "@/data/repositories/business-repository";
import { useAuth } from "@/features/auth/auth-context";

export function useBarberWorkspace() {
  const { user } = useAuth();
  const profileQuery = useQuery({
    queryKey: ["barber-profile", user?.id],
    queryFn: () => getBarberByUserId(user!.id),
    enabled: Boolean(user),
  });
  const appointmentsQuery = useQuery({
    queryKey: ["barber-appointments", profileQuery.data?.id],
    queryFn: () => listBarberAppointments(profileQuery.data!),
    enabled: Boolean(profileQuery.data),
  });

  return {
    profile: profileQuery.data ?? null,
    appointments: appointmentsQuery.data ?? [],
    loading: profileQuery.isLoading || appointmentsQuery.isLoading,
    error: profileQuery.error ?? appointmentsQuery.error,
    refetchProfile: profileQuery.refetch,
    refetchAppointments: appointmentsQuery.refetch,
    user,
  };
}
