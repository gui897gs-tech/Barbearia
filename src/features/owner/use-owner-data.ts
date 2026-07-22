import { useQuery } from "@tanstack/react-query";
import {
  listAppointments,
  listEmployees,
  listProducts,
  listServices,
} from "@/data/repositories/business-repository";

export function useOwnerData() {
  const query = useQuery({
    queryKey: ["owner-business-data"],
    queryFn: async () => {
      const [appointments, employees, products, services] = await Promise.all([
        listAppointments(),
        listEmployees(),
        listProducts(),
        listServices(),
      ]);
      return { appointments, employees, products, services };
    },
  });

  return {
    appointments: query.data?.appointments ?? [],
    employees: query.data?.employees ?? [],
    products: query.data?.products ?? [],
    services: query.data?.services ?? [],
    loading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
