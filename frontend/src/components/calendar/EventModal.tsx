import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { format, addMinutes, parseISO, isBefore, startOfDay, isValid } from 'date-fns';
import Flatpickr from 'react-flatpickr';
import { english } from 'flatpickr/dist/l10n/default';
import 'flatpickr/dist/flatpickr.min.css';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Event, CreateEventDto } from '../../types';
import { MapPin, Users, Book, X, Calendar } from 'lucide-react';
import { useGroups, useSubjects } from '../../hooks/useApi';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { FormError } from '../ui/FormError';
import { formatISO } from 'date-fns';

interface EventModalProps {
  event?: Event;
  initialDate?: Date;
  onSave: (eventData: CreateEventDto) => Promise<void>;
  onClose: () => void;
  onDelete?: () => void;
  validationErrors?: Record<string, string>;
}

interface EventFormData {
  title: string;
  group: string;
  subject: string;
  start: string;
  end: string;
  type: 'lecture' | 'practice' | 'lab' | 'other';
  location: string;
  notes: string;
  color: string;
}

const DEFAULT_COLOR = '#6366F1';

const EventModal: React.FC<EventModalProps> = ({
  event,
  initialDate,
  onSave,
  onClose,
  onDelete,
  validationErrors = {},
}) => {
  const { data: groupsData, isLoading: isLoadingGroups } = useGroups();
  const { data: subjectsData, isLoading: isLoadingSubjects } = useSubjects();
  const modalBackdropRef = useRef<HTMLDivElement>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localValidationErrors, setLocalValidationErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    group: '',
    subject: '',
    start: initialDate ? format(initialDate, "yyyy-MM-dd'T'HH:mm") : '',
    end: initialDate ? format(addMinutes(initialDate, 90), "yyyy-MM-dd'T'HH:mm") : '',
    type: 'lecture',
    location: '',
    notes: '',
    color: DEFAULT_COLOR,
  });

  const allErrors = useMemo(() => ({
    ...validationErrors,
    ...localValidationErrors
  }), [validationErrors, localValidationErrors]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const validateEventForm = useCallback(() => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) errors.title = 'Title is required';
    if (!formData.group) errors.group = 'Group is required';
    if (!formData.subject) errors.subject = 'Subject is required';
    if (!formData.start) errors.start = 'Start time is required';
    if (!formData.end) errors.end = 'End time is required';
    
    if (formData.start && formData.end) {
      const start = parseISO(formData.start);
      const end = parseISO(formData.end);
      if (start >= end) errors.end = 'End time must be after start';
    }

    setLocalValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  useEffect(() => {
    if (formData.group && groupsData?.data) {
      const selectedGroup = groupsData.data.find(g => g.id === formData.group);
      setFormData(prev => ({
        ...prev,
        color: selectedGroup?.color || DEFAULT_COLOR
      }));
    }
  }, [formData.group, groupsData]);

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        group: event.group,
        subject: event.subject,
        start: event.start,
        end: event.end,
        type: event.type,
        location: event.location || '',
        notes: event.notes || '',
        color: event.color || DEFAULT_COLOR,
      });
    } else if (initialDate) {
      setFormData(prev => ({
        ...prev,
        start: format(initialDate, "yyyy-MM-dd'T'HH:mm"),
        end: format(addMinutes(initialDate, 90), "yyyy-MM-dd'T'HH:mm")
      }));
    }
  }, [event, initialDate]);

  useEffect(() => {
    if (groupsData?.data && !event && !formData.group) {
      setFormData(prev => ({
        ...prev,
        group: groupsData.data[0]?.id || '',
        color: groupsData.data[0]?.color || DEFAULT_COLOR
      }));
    }
  }, [groupsData, event, formData.group]);

  useEffect(() => {
    if (subjectsData?.data && !event && !formData.subject) {
      setFormData(prev => ({
        ...prev,
        subject: subjectsData.data[0]?.id || ''
      }));
    }
  }, [subjectsData, event, formData.subject]);

  const handleDateChange = useCallback((dates: Date[], type: 'start' | 'end') => {
    if (dates.length === 0 || !isValid(dates[0])) return;
    
    const dateString = formatISO(dates[0]); 
    
    if (type === 'start') {
      const endDate = addMinutes(dates[0], 90);
      setFormData(prev => ({
        ...prev,
        start: dateString,
        end: formatISO(endDate)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [type]: dateString
      }));
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEventForm()) return;

    setIsSubmitting(true);
    try {
      const eventDto: CreateEventDto = {
        title: formData.title,
        start: formData.start,
        end: formData.end,
        type: formData.type,
        group: formData.group,
        subject: formData.subject,
        location: formData.location,
        notes: formData.notes,
        color: formData.color,
      };
      await onSave(eventDto);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, onSave, validateEventForm]);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    
    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete, onClose]);

  const isEventEditable = useCallback(() => {
    if (!event?.start) return true;
    return !isBefore(parseISO(event.start), startOfDay(new Date()));
  }, [event]);

  const groupOptions = useMemo(() => 
    groupsData?.data?.map(group => ({
      value: group.id,
      label: group.name,
      color: group.color,
    })) || [],
    [groupsData]
  );

  const subjectOptions = useMemo(() => 
    subjectsData?.data?.map(subject => ({
      value: subject.id,
      label: subject.name,
    })) || [],
    [subjectsData]
  );

  if (isLoadingGroups || isLoadingSubjects) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (event && !isEventEditable()) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-3 sm:p-6">
          <div className="flex items-center mb-3 sm:mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
              Past Event
            </h3>
            <div className="flex items-center gap-2 sm:gap-4 ml-auto">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 capitalize max-w-xs truncate">
                {event.type}
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="space-y-3 sm:space-y-6">
            <div className="flex items-center space-x-3 min-w-0">
              <div 
                className="w-3 h-3 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-lg flex-shrink-0"
                style={{ backgroundColor: event.color || DEFAULT_COLOR }}
              />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white break-words truncate">
                {event.title}
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-8">
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center text-gray-600 dark:text-gray-400 min-h-[40px] sm:min-h-[48px]">
                  <Calendar className="h-5 w-5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {format(parseISO(event.start), 'PPP')}
                    </p>
                    <p className="text-sm truncate">
                      {format(parseISO(event.start), 'p')} - {format(parseISO(event.end), 'p')}
                    </p>
                  </div>
                </div>
                {event.location && (
                  <div className="flex items-center truncate text-gray-600 dark:text-gray-400 min-h-[40px] sm:min-h-[48px]">
                    <MapPin className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="flex items-center text-gray-600 dark:text-gray-400 min-h-[40px] sm:min-h-[48px]">
                  <Users className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span className="truncate">{event.group_name}</span>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400 min-h-[40px] sm:min-h-[48px]">
                  <Book className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span className="truncate">{event.subject_name}</span>
                </div>
              </div>
            </div>
            {event.notes && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 sm:pt-4 sm:mt-4">
                <div className="flex items-baseline text-gray-600 dark:text-gray-400">
                  <span className="font-semibold mr-3 select-none whitespace-nowrap">Notes:</span>
                  <p className="text-sm truncate">
                    {event.notes}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      ref={modalBackdropRef}
      onMouseDown={(e) => e.target === modalBackdropRef.current && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {event ? 'Edit Event' : 'Add New Event'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {allErrors.non_field && (
              <FormError message={allErrors.non_field} />
            )}

            <div className="space-y-6">
              <Input
                label="Title *"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                error={allErrors.title}
                id="title"
                leftIcon={<Calendar className="h-4 w-4" />}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Select
                  label="Group *"
                  value={formData.group}
                  onChange={(e) => setFormData(prev => ({ ...prev, group: e.target.value }))}
                  options={groupOptions}
                  error={allErrors.group}
                  id="group"
                  leftIcon={<Users className="h-4 w-4" />}
                />

                <Select
                  label="Subject *"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  options={subjectOptions}
                  error={allErrors.subject}
                  id="subject"
                  leftIcon={<Book className="h-4 w-4" />}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time *
                  </label>
                  <Flatpickr
                    data-enable-time
                    options={{
                      enableTime: true,
                      dateFormat: "Y-m-d H:i",
                      locale: english,
                      time_24hr: true,
                      minuteIncrement: 15,
                      disableMobile: true
                    }}
                    value={formData.start ? parseISO(formData.start) : undefined}
                    onChange={(dates) => handleDateChange(dates, 'start')}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary-500"
                  />
                  {allErrors.start && (
                    <span className="text-red-500 text-sm mt-1 block">{allErrors.start}</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Time *
                  </label>
                  <Flatpickr
                    data-enable-time
                    options={{
                      enableTime: true,
                      dateFormat: "Y-m-d H:i",
                      locale: english,
                      time_24hr: true,
                      minuteIncrement: 15,
                      disableMobile: true
                    }}
                    value={formData.end ? parseISO(formData.end) : undefined}
                    onChange={(dates) => handleDateChange(dates, 'end')}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 focus:ring-2 focus:ring-primary-500"
                  />
                  {allErrors.end && (
                    <span className="text-red-500 text-sm mt-1 block">{allErrors.end}</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Select
                  label="Event Type *"
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    type: e.target.value as EventFormData['type'] 
                  }))}
                  options={[
                    { value: 'lecture', label: 'Lecture' },
                    { value: 'practice', label: 'Practice' },
                    { value: 'lab', label: 'Lab' },
                    { value: 'other', label: 'Other' },
                  ]}
                  leftIcon={<Book className="h-4 w-4" />}
                />

                <Input
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: e.target.value 
                  }))}
                  placeholder="Enter location"
                  id="location"
                  leftIcon={<MapPin className="h-4 w-4" />}
                />
              </div>

              <Textarea
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  notes: e.target.value 
                }))}
                error={allErrors.notes}
                id="notes"
              />

              <div className="flex items-center gap-2 mt-4">
                <div 
                  className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-lg"
                  style={{ backgroundColor: formData.color }}
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Event color based on selected group
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 flex justify-end gap-3 rounded-b-xl">
            {event && onDelete && (
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={isSubmitting || isDeleting}
                isLoading={isDeleting}
              >
                Delete Event
              </Button>
            )}
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting || isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting || isDeleting}
            >
              {event ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default React.memo(EventModal);