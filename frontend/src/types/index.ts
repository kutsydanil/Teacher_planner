import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  picture: z.string().url(),
  isEmailVerified: z.boolean(),
});

export type User = z.infer<typeof UserSchema>;

export const SubjectSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  created_at: z.string(),
});

export type Subject = z.infer<typeof SubjectSchema>;

export const GroupSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  color: z.string(),
  created_at: z.string(),
});

export type Group = z.infer<typeof GroupSchema>;

export const PlanSchema = z.object({
  id: z.string(),
  name: z.string().min(1),

  subject: z.string(),
  subject_name: z.string(),
  group: z.string(),
  group_name: z.string(),
  lecture_hours: z.number().min(0),
  practice_hours: z.number().min(0),
  lab_hours: z.number().min(0),
  other_hours: z.number().min(0),
  created_at: z.string(),
});


export type Plan = z.infer<typeof PlanSchema>;

export const EventTypeSchema = z.enum(['lecture', 'practice', 'lab', 'other']);

export const EventSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  group: z.string(),
  group_name: z.string(),
  color: z.string(),
  subject: z.string(),
  subject_name: z.string(),
  start: z.string(),
  end: z.string(),
  type: EventTypeSchema,
  location: z.string().optional(),
  notes: z.string().optional(),
  created_at: z.string(),
});

export type Event = z.infer<typeof EventSchema>;

export const MonthlyStatsSchema = z.object({
  id: z.string(),
  group_id: z.string(),
  group_name: z.string(),
  subject_id: z.string(),
  subject_name: z.string(),
  lecture_hours: z.number(),
  practice_hours: z.number(),
  lab_hours: z.number(),
  other_hours: z.number(),
  month: z.number(),
  year: z.number(),
});

export type MonthlyStats = z.infer<typeof MonthlyStatsSchema>;

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (code: string) => Promise<void>;
  logout: () => Promise<void>;
}

export type AuthResponse = {
  token: string;
  user: User;
};

export type ApiResponse<T> = {
  data: T;
  message?: string;
};

export type ApiError = {
  message: string;
  code?: string;
  details?: Record<string, string[]>;
};

export type CreateSubjectDto = Omit<Subject, 'id' | 'created_at'>;
export type UpdateSubjectDto = Partial<CreateSubjectDto>;

export type CreateGroupDto = Omit<Group, 'id' | 'created_at'>;
export type UpdateGroupDto = Partial<CreateGroupDto>;

export type CreatePlanDto = Omit<Plan, 'id' | 'group_name' | 'subject_name' | 'created_at'>;
export type UpdatePlanDto = Partial<CreatePlanDto>;

export type CreateEventDto = Omit<Event, 'id' | 'group_name' | 'subject_name' | 'created_at'>;
export type UpdateEventDto = Partial<CreateEventDto>;

