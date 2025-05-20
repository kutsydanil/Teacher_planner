import { useQuery, useMutation, useQueryClient } from 'react-query';
import { subjectsApi, groupsApi, eventsApi, statsApi, plansApi } from '../services/api';
import type {Subject, Group, Event, MonthlyStats, ApiResponse, ApiError, CreateSubjectDto, UpdateSubjectDto, CreateGroupDto, UpdateGroupDto,
  CreateEventDto, UpdateEventDto, CreatePlanDto, UpdatePlanDto, Plan} from '../types';

export const useSubjects = () => {
  return useQuery<ApiResponse<Subject[]>, ApiError>(
    'subjects',
    () => subjectsApi.getAll()
  );
};

export const useSubjectMutations = () => {
  const queryClient = useQueryClient();

  const createSubject = useMutation<ApiResponse<Subject>, ApiError, Partial<Subject>>({
    mutationFn: (data) => subjectsApi.create(data as CreateSubjectDto),
    onSuccess: () => {
      queryClient.invalidateQueries('subjects');
    },
  });

  const updateSubject = useMutation<ApiResponse<Subject>, ApiError, { id: string; data: Partial<Subject> }>({
    mutationFn: ({ id, data }) => subjectsApi.update(id, data as UpdateSubjectDto),
    onSuccess: () => {
      queryClient.invalidateQueries('subjects');
    },
  });

  const deleteSubject = useMutation<void, ApiError, string>({
    mutationFn: (id) => subjectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries('subjects');
    },
  });

  return { createSubject, updateSubject, deleteSubject };
};


export const useGroups = () => {
  return useQuery<ApiResponse<Group[]>, ApiError>(
    'groups',
    () => groupsApi.getAll()
  );
};

export const useGroupMutations = () => {
  const queryClient = useQueryClient();

  const createGroup = useMutation<ApiResponse<Group>, ApiError, CreateGroupDto>({
    mutationFn: (data) => groupsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries('groups');
    },
  });

  const updateGroup = useMutation<ApiResponse<Group>, ApiError, { id: string; data: UpdateGroupDto }>({
    mutationFn: ({ id, data }) => groupsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries('groups');
    },
  });

  const deleteGroup = useMutation<void, ApiError, string>({
    mutationFn: (id) => groupsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries('groups');
    },
  });

  return { createGroup, updateGroup, deleteGroup };
};

export const usePlans = () => {
  return useQuery<ApiResponse<Plan[]>, ApiError>(
    'plans',
    () => plansApi.getAll()
  );
};

export const usePlanMutations = () => {
  const queryClient = useQueryClient();

  const createPlan = useMutation<ApiResponse<Plan>, ApiError, CreatePlanDto>({
    mutationFn: (data) => plansApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries('plans');
    },
  });

  const updatePlan = useMutation<ApiResponse<Plan>, ApiError, { id: string; data: UpdatePlanDto }>({
    mutationFn: ({ id, data }) => plansApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries('plans');
    },
  });

  const deletePlan = useMutation<void, ApiError, string>({
    mutationFn: (id) => plansApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries('plans');
    },
  });

  return { createPlan, updatePlan, deletePlan };
};

// Events hooks
export const useEvents = (start?: string, end?: string) => {
  return useQuery<ApiResponse<Event[]>, ApiError>(
    ['events', start, end],
    () => start && end 
      ? eventsApi.getByDateRange(start, end)
      : eventsApi.getAll(),
    {
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      cacheTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: false,
    }
  );
};

export const useEventMutations = () => {
  const queryClient = useQueryClient();

  const createEvent = useMutation<ApiResponse<Event>, ApiError, CreateEventDto>({
    mutationFn: (data) => eventsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries('events');
    },
  });

  const updateEvent = useMutation<ApiResponse<Event>, ApiError, { id: string; data: UpdateEventDto }>({
    mutationFn: ({ id, data }) => eventsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries('events');
    },
  });

  const deleteEvent = useMutation<void, ApiError, string>({
    mutationFn: (id) => eventsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries('events');
    }
  });

  return { createEvent, updateEvent, deleteEvent };
};

// Stats hooks
export const useMonthlyStats = (month?: number, year?: number) => {
  return useQuery<ApiResponse<MonthlyStats[]>, ApiError>(
    ['stats', month, year],
    () => month !== undefined && year !== undefined
      ? statsApi.getByMonth(month, year)
      : statsApi.getAll(),
    {
      staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
      cacheTime: 30 * 60 * 1000, // Cache for 30 minutes
      refetchOnMount: true,
      refetchOnWindowFocus: false,
      enabled: !!(month !== undefined && year !== undefined),
    }
  );
};