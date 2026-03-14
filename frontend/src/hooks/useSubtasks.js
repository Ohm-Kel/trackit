import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchSubtasks, createSubtask, updateSubtask, deleteSubtask } from '../api/subtasks';

export function useSubtasks(parentId, parentType = 'task') {
  return useQuery({
    queryKey: ['subtasks', parentId],
    queryFn: () => fetchSubtasks(parentId, parentType),
    enabled: !!parentId,
    staleTime: 30_000,
  });
}

export function useCreateSubtask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSubtask,
    onSuccess: (_, variables) => {
      const parentId = variables.task_id || variables.exam_id;
      queryClient.invalidateQueries({ queryKey: ['subtasks', parentId] });
    },
  });
}

export function useUpdateSubtask(parentId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }) => updateSubtask(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subtasks', parentId] }),
  });
}

export function useDeleteSubtask(parentId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSubtask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['subtasks', parentId] }),
  });
}
