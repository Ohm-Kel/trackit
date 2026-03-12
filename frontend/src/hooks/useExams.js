import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchExams, createExam, updateExam, deleteExam } from '../api/exams';

export function useExams(userId) {
  return useQuery({
    queryKey: ['exams', userId],
    queryFn: () => fetchExams(userId),
    staleTime: 30_000,
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

export function useUpdateExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }) => updateExam(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
    },
  });
}
