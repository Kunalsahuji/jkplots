import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertyService } from '@/services/propertyService';
import { toast } from 'sonner';

/**
 * Hook to query properties list with caching
 * @param {Object} filters - Search, filter, page, sort and limit parameters
 * @returns {Object} React Query state
 */
export function useProperties(filters = {}) {
  return useQuery({
    queryKey: ['properties', filters],
    queryFn: () => propertyService.getProperties(filters),
    placeholderData: (previousData) => previousData, // keep previous data visible while fetching next page
    staleTime: 5 * 60 * 1000, // 5 minutes cache validity
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to query details of a single property by ID
 * @param {string} id - Property MongoDB ID
 * @returns {Object} React Query state
 */
export function useProperty(id) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => propertyService.getProperty(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes cache validity
    refetchOnWindowFocus: false,
  });
}

/**
 * Hook to handle property creation
 */
export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: propertyService.createProperty,
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['properties'] });
        toast.success('Property created successfully!');
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create property listing.');
    }
  });
}

/**
 * Hook to handle property update
 */
export function useUpdateProperty(id) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (propertyData) => propertyService.updateProperty(id, propertyData),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['properties'] });
        queryClient.invalidateQueries({ queryKey: ['property', id] });
        toast.success('Property updated successfully!');
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update property listing.');
    }
  });
}

/**
 * Hook to handle property deletion
 */
export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: propertyService.deleteProperty,
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['properties'] });
        toast.success('Property deleted successfully!');
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete listing.');
    }
  });
}
