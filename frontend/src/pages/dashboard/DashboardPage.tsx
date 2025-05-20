import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, Users, Book, Clock3, Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import Calendar from '../../components/calendar/Calendar';
import EventModal from '../../components/calendar/EventModal';
import { Event, CreateEventDto } from '../../types';
import { format, isSameDay, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { LoadingCard } from '../../components/ui/LoadingCard';
import { useEvents, useEventMutations } from '../../hooks/useApi';
import { parseApiValidationError } from '../../utils/apiError';

const ITEMS_PER_PAGE = 5;

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | undefined>(undefined);
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const { data: events, isLoading } = useEvents();
  const { createEvent, updateEvent, deleteEvent } = useEventMutations();
  
  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleAddEvent = (date: Date) => {
    setSelectedEvent(undefined);
    setNewEventDate(date);
    setIsEventModalOpen(true);
    setValidationErrors({});
  };

  const handleSaveEvent = async (eventData: CreateEventDto) => {
    try {
      if (selectedEvent) {
        await updateEvent.mutateAsync({
          id: selectedEvent.id,
          data: eventData
        });
        toast.success('Event updated successfully');
      } else {
        await createEvent.mutateAsync(eventData);
        toast.success('Event created successfully');
      }
      setIsEventModalOpen(false);
      setNewEventDate(null);
      setValidationErrors({});
    } catch (error) {
      const errors = parseApiValidationError(error);
      setValidationErrors(errors);
      toast.error(Object.values(errors)[0] || 'Failed to save event');
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent.mutateAsync(eventId);
      toast.success('Event deleted successfully');
      setIsEventModalOpen(false);
    } catch (error) {
      const errors = parseApiValidationError(error);
      toast.error(Object.values(errors)[0] || 'Failed to delete event');
    }
  };

  const selectedDateEvents = (events?.data || [])
    .filter((event) =>
      event.start &&
      typeof event.start === 'string' &&
      isSameDay(parseISO(event.start), selectedDate)
    )
    .sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());

  const totalPages = Math.ceil(selectedDateEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = selectedDateEvents.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages - 1));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 0));
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <LoadingCard key={i} />
            ))}
          </div>
          <LoadingCard message="Loading calendar..." />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300">
            Welcome back, {user?.name || 'Teacher'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Here's your teaching dashboard</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10 hover:border-primary-300 dark:hover:border-primary-600">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900/30 rounded-full p-3">
                <CalendarIcon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Classes</h2>
                <p className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-primary-500">
                  {selectedDateEvents.length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-secondary-500/5 dark:hover:shadow-secondary-500/10 hover:border-secondary-300 dark:hover:border-secondary-600">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-secondary-100 dark:bg-secondary-900/30 rounded-full p-3">
                <Clock className="h-6 w-6 text-secondary-600 dark:text-secondary-400" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Events</h2>
                <p className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-secondary-600 to-secondary-500">
                  {events?.data?.length || 0}
                </p>
              </div>
            </div>
          </div>
          
          <div className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-accent-500/5 dark:hover:shadow-accent-500/10 hover:border-accent-300 dark:hover:border-accent-600">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-accent-100 dark:bg-accent-900/30 rounded-full p-3">
                <Users className="h-6 w-6 text-accent-600 dark:text-accent-400" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Groups</h2>
                <p className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-accent-600 to-accent-500">
                  {new Set(events?.data?.map(e => e.subject_name) || []).size}
                </p>
              </div>
            </div>
          </div>
          
          <div className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-success-500/5 dark:hover:shadow-success-500/10 hover:border-success-300 dark:hover:border-success-600 hover:-translate-y-0.5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-success-100 dark:bg-success-900/30 rounded-full p-3">
                <Book className="h-6 w-6 text-success-600 dark:text-success-400" />
              </div>
              <div className="ml-4">
                <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400">Subjects</h2>
                <p className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-success-600 to-success-500">
                  {new Set(events?.data?.map(e => e.subject_name) || []).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10 hover:border-primary-300 dark:hover:border-primary-600">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Calendar</h2>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden backdrop-blur-sm">
                  <button
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                      calendarView === 'month'
                        ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white'
                        : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setCalendarView('month')}
                  >
                    Month
                  </button>
                  <button
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${
                      calendarView === 'week'
                        ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white'
                        : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setCalendarView('week')}
                  >
                    Week
                  </button>
                  <button
                    className={`flex-1 px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 dark:border-gray-700 ${
                      calendarView === 'day'
                        ? 'bg-gradient-to-r from-primary-600 to-primary-500 text-white'
                        : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                    onClick={() => setCalendarView('day')}
                  >
                    Day
                  </button>
                </div>
                <Button
                  leftIcon={<Plus className="h-5 w-5" />}
                  onClick={() => handleAddEvent(selectedDate)}
                  className="w-full sm:w-auto bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600"
                >
                  Add Event
                </Button>
              </div>
            </div>
            
            <Calendar
              events={events?.data || []}
              view={calendarView}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onEventClick={handleEventClick}
              onAddEvent={handleAddEvent}
            />
          </div>

          <div className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200/50 dark:border-gray-700/50 p-6 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10 hover:border-primary-300 dark:hover:border-primary-600 cursor-pointer">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                Events for {format(selectedDate, 'MMMM d, yyyy')}
              </h2>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => handleAddEvent(selectedDate)}
                className="hover:bg-primary-50 dark:hover:bg-primary-900/20"
              >
                Add
              </Button>
            </div>

            {selectedDateEvents.length > 0 ? (
              <div className="space-y-4">
                {paginatedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="group bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-200/50 dark:border-gray-700/50 p-4 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10 hover:border-primary-300 dark:hover:border-primary-600"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex items-center space-x-2 whitespace-nowrap">
                      <div
                        className="w-4 h-4 rounded-full ring-2 ring-white dark:ring-gray-800 shadow-lg flex-shrink-0"
                        style={{ backgroundColor: event.color }}
                      />
                      <h3 className="font-medium truncate text-gray-900 dark:text-white leading-none">
                        {event.title}
                      </h3>
                    </div>

                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <div className="flex items-center space-x-2">
                        <Clock3 className="w-4 h-4 flex-shrink-0" />
                        <span className="leading-none">
                          {format(parseISO(event.start), 'h:mm a')} - {format(parseISO(event.end), 'h:mm a')}
                        </span>
                      </div>

                      {event.location && (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 flex-shrink-0 flex items-center justify-center leading-none">📍</div>
                          <span className="leading-none">{event.location}</span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 flex-shrink-0" />
                        <span className="leading-none">{event.group_name}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Book className="w-4 h-4 flex-shrink-0" />
                        <span className="leading-none">{event.subject_name}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handlePrevPage}
                      disabled={currentPage === 0}
                      leftIcon={<ChevronLeft className="h-4 w-4" />}
                      className="hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages - 1}
                      rightIcon={<ChevronRight className="h-4 w-4" />}
                      className="hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No events scheduled for this day
              </div>
            )}
          </div>
        </div>

        {isEventModalOpen && (
          <EventModal
            event={selectedEvent}
            initialDate={newEventDate || undefined}
            onSave={handleSaveEvent}
            onClose={() => {
              setIsEventModalOpen(false);
              setNewEventDate(null);
              setValidationErrors({});
            }}
            onDelete={selectedEvent ? () => handleDeleteEvent(selectedEvent.id) : undefined}
            validationErrors={validationErrors}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;