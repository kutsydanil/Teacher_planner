import React, { useState, useEffect, useRef } from 'react';
import { 
  format, 
  startOfWeek, 
  addDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  parseISO, 
  differenceInMinutes, 
  isBefore, 
  startOfDay 
} from 'date-fns';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import { Event } from '../../types';

const EVENTS_PER_PAGE = 2;
const MIN_EVENT_HEIGHT = 55;
const TIME_SLOT_HEIGHT = 5;
const MIN_TIME_SLOT_HEIGHT = 5;

interface CalendarProps {
  events: Event[];
  view: 'month' | 'week' | 'day';
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEventClick: (event: Event) => void;
  onAddEvent: (date: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  events,
  view,
  selectedDate,
  onDateSelect,
  onEventClick,
  onAddEvent,
}) => {
  const [eventPages, setEventPages] = useState<Record<string, number>>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [focusedDay, setFocusedDay] = useState<number | null>(null);
  const today = startOfDay(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);
  const timeIndicatorRef = useRef<HTMLDivElement>(null);
  const daysRef = useRef<(HTMLDivElement | null)[]>([]);
  const selectedDayRef = useRef<HTMLDivElement | null>(null);

  const calculateTimeScale = () => {
    if (view === 'month') return { hourHeight: TIME_SLOT_HEIGHT };

    let minDuration = Infinity;
    let maxEventsPerSlot = 1;
    const eventsByHour: Record<number, number> = {};

    events.forEach(event => {
      if (!event.start || !event.end) return;
      
      const startTime = parseISO(event.start);
      const endTime = parseISO(event.end);
      const duration = differenceInMinutes(endTime, startTime);
      
      if (duration < minDuration) {
        minDuration = duration;
      }

      const startHour = startTime.getHours();
      const endHour = endTime.getHours();
      for (let hour = startHour; hour <= endHour; hour++) {
        eventsByHour[hour] = (eventsByHour[hour] || 0) + 1;
        maxEventsPerSlot = Math.max(maxEventsPerSlot, eventsByHour[hour]);
      }
    });

    const minHeightNeeded = MIN_EVENT_HEIGHT * maxEventsPerSlot;
    const hourHeight = Math.max(
      minHeightNeeded,
      Math.floor(TIME_SLOT_HEIGHT * (60 / Math.max(minDuration, 15)))
    );

    return {
      hourHeight: Math.max(hourHeight, MIN_TIME_SLOT_HEIGHT),
      maxEventsPerSlot
    };
  };

  const { hourHeight } = calculateTimeScale();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!calendarRef.current) return;

    if (view === 'week' || view === 'day') {
      const currentHour = currentTime.getHours();
      const scrollPosition = (currentHour * hourHeight) - (calendarRef.current.clientHeight / 2);
      calendarRef.current.scrollTo({
        top: Math.max(0, scrollPosition),
        behavior: 'smooth'
      });
    } else if (view === 'month' && selectedDayRef.current) {
      selectedDayRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      setTimeout(() => {
        if (selectedDayRef.current) {
          selectedDayRef.current.focus();
        }
      }, 300);
    }
  }, [view, selectedDate, hourHeight, currentTime]);

  const isValidEventDate = (event: Event): boolean => {
    return Boolean(event.start && typeof event.start === 'string' && event.end && typeof event.end === 'string');
  };

  const getEventStyle = (event: Event) => {
    if (!isValidEventDate(event)) return {};
    
    const startTime = parseISO(event.start);
    const endTime = parseISO(event.end);
    const duration = differenceInMinutes(endTime, startTime);
    const top = (startTime.getHours() * hourHeight) + ((startTime.getMinutes() / 60) * hourHeight);
    const height = (duration / 60) * hourHeight;

    return {
      top: `${top}px`,
      height: `${Math.max(height, MIN_EVENT_HEIGHT)}px`,
      backgroundColor: event.color || '#6366F1',
    };
  };

  const getDateKey = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };

  const getCurrentPage = (date: Date): number => {
    return eventPages[getDateKey(date)] || 0;
  };

  const handleNextPage = (date: Date) => {
    const dateKey = getDateKey(date);
    setEventPages(prev => ({ ...prev, [dateKey]: (prev[dateKey] || 0) + 1 }));
  };

  const handlePrevPage = (date: Date) => {
    const dateKey = getDateKey(date);
    setEventPages(prev => ({ ...prev, [dateKey]: Math.max(0, (prev[dateKey] || 0) - 1) }));
  };

  const isDateEditable = (date: Date): boolean => {
    return !isBefore(date, today);
  };

  const renderEventsList = (date: Date, dayEvents: Event[]) => {
    const currentPage = getCurrentPage(date);
    const totalPages = Math.ceil(dayEvents.length / EVENTS_PER_PAGE);
    const paginatedEvents = dayEvents.slice(
      currentPage * EVENTS_PER_PAGE,
      (currentPage + 1) * EVENTS_PER_PAGE
    );

    return (
      <div className="space-y-1">
        {paginatedEvents.map((event) => (
          <div
            key={event.id}
            className={`group text-xs p-2 rounded-lg backdrop-blur-sm cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10 ${
              !isDateEditable(parseISO(event.start)) ? 'opacity-60' : ''
            }`}
            style={{ 
              backgroundColor: event.color || '#6366F1',
              color: '#fff',
            }}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick(event);
            }}
          >
            <div className="font-medium truncate block">{event.title}</div>
            {isValidEventDate(event) && (
              <div className="text-xs opacity-90">
                {format(parseISO(event.start), 'h:mm a')}
              </div>
            )}
          </div>
        ))}
        
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-2 text-xs">
            <button
              className={`text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors ${currentPage === 0 ? 'invisible' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handlePrevPage(date);
              }}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-gray-500 dark:text-gray-400">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              className={`text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors ${currentPage >= totalPages - 1 ? 'invisible' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                handleNextPage(date);
              }}
              disabled={currentPage >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const startDate = startOfWeek(monthStart);
    const days = eachDayOfInterval({ start: startDate, end: monthEnd });

    daysRef.current = [];

    return (
      <div className="overflow-x-auto" ref={calendarRef}>
        <div className="min-w-[1024px] m-2">
          <div className="sticky grid grid-cols-7 gap-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-700 dark:text-gray-300 py-2">
                {day}
              </div>
            ))}
            {days.map((day, idx) => {
              const dayEvents = events.filter(event => 
                isValidEventDate(event) && isSameDay(parseISO(event.start), day)
              ).sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());

              const isEditable = isDateEditable(day);
              const isToday = isSameDay(day, new Date());
              const isFocused = idx === focusedDay;
              const isSelected = isSameDay(day, selectedDate);

              return (
                <div
                  key={idx}
                  ref={(el) => {
                    daysRef.current[idx] = el;
                    if (isSelected) {
                      selectedDayRef.current = el;
                    }
                  }}
                  tabIndex={0}
                  data-current-day={isToday ? "true" : "false"}
                  className={`
                    group min-h-[140px] p-2 rounded-lg backdrop-blur-sm transition-all duration-300 outline-none
                    ${isEditable ? 'cursor-pointer hover:shadow-lg hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10 hover:border-primary-300 dark:hover:border-primary-600 hover:-translate-y-0.5' : 'cursor-not-allowed'}
                    ${!isSameMonth(day, selectedDate) ? 'bg-gray-50/50 dark:bg-gray-800/50' : 'bg-white/80 dark:bg-gray-900/80'}
                    ${isSelected ? 'border-primary-500 dark:border-primary-500 ring-1 ring-primary-500' : 'border border-gray-200/50 dark:border-gray-700/50'}
                    ${isToday ? 'ring-2 ring-primary-500' : ''}
                    ${isFocused ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-500/10' : ''}
                  `}
                  onClick={() => {
                    if (isEditable) {
                      onDateSelect(day);
                      setFocusedDay(idx);
                    }
                  }}
                  onFocus={() => setFocusedDay(idx)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={`
                      text-sm font-medium rounded-full w-7 h-7 flex items-center justify-center transition-colors
                      ${isToday ? 'bg-primary-500 text-white' : 'text-gray-700 dark:text-gray-300 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20'}
                    `}>
                      {format(day, 'd')}
                    </span>
                    {dayEvents.length > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {renderEventsList(day, dayEvents)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate);
    const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
      <div className="overflow-y-auto max-h-[800px] relative" ref={calendarRef}>
        <div className="grid grid-cols-8 gap-2 min-w-[1024px]">
          <div className="pt-16 sticky left-0 bg-white dark:bg-gray-900 z-20">
            {hours.map((hour) => (
              <div 
                key={hour} 
                className="border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 pr-2 text-right"
                style={{ height: `${hourHeight}px` }}
              >
                {format(new Date().setHours(hour, 0), 'h:mm a')}
              </div>
            ))}
          </div>

          {days.map((day, dayIdx) => {
            const dayEvents = events.filter(event => 
              isValidEventDate(event) && isSameDay(parseISO(event.start), day)
            );

            const isEditable = isDateEditable(day);
            const isToday = isSameDay(day, new Date());

            return (
              <div 
                key={dayIdx} 
                className="flex-1 relative"
                data-current-day={isToday ? "true" : "false"}
              >
                <div className="h-16 text-center sticky top-0 bg-white dark:bg-gray-900 z-30">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {format(day, 'EEE')}
                  </div>
                  <div className={`
                    text-sm rounded-full w-8 h-8 flex items-center justify-center mx-auto transition-colors
                    ${isToday ? 'bg-primary-500 text-white' : 'text-gray-600 dark:text-gray-400'}
                  `}>
                    {format(day, 'd')}
                  </div>
                </div>
                <div 
                  className={`relative ${isEditable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                  onClick={() => isEditable && onAddEvent(day)}
                >
                  {hours.map((hour) => (
                    <div 
                      key={hour}
                      className="border-t border-gray-200 dark:border-gray-700"
                      style={{ height: `${hourHeight}px` }}
                    />
                  ))}
                  {isToday && (
                    <div 
                      ref={timeIndicatorRef}
                      className="absolute left-0 right-0 z-10 pointer-events-none"
                      style={{ 
                        top: `${(currentTime.getHours() + (currentTime.getMinutes() / 60)) * hourHeight}px` 
                      }}
                    >
                      <div className="relative">
                        <div className="absolute -left-2 w-4 h-4 rounded-full bg-red-500"></div>
                        <div className="border-t-2 border-red-500 w-full"></div>
                      </div>
                    </div>
                  )}
                  {dayEvents.map((event) => {
                    if (!isValidEventDate(event)) return null;
                    
                    return (
                      <div
                        key={event.id}
                        className={`absolute left-0 right-0 mx-1 rounded-lg shadow-sm backdrop-blur-sm cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10 z-20 ${
                          !isDateEditable(parseISO(event.start)) ? 'opacity-60' : ''
                        }`}
                        style={getEventStyle(event)}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(event);
                        }}
                      >
                        <div className="p-2 text-white">
                          <div className="font-medium truncate">{event.title}</div>
                          <div className="text-sm truncate">{format(parseISO(event.start), 'h:mm a')}</div>
                          {event.location && (
                            <div className="flex items-center mt-1 text-sm">
                              <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                              <span className="truncate">{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = events.filter(event => 
      isValidEventDate(event) && isSameDay(parseISO(event.start), selectedDate)
    ).sort((a, b) => parseISO(a.start).getTime() - parseISO(b.start).getTime());

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const isEditable = isDateEditable(selectedDate);
    const isToday = isSameDay(selectedDate, new Date());

    return (
      <div className="space-y-4">
        <div className="text-center sticky top-0 bg-white dark:bg-gray-900 z-10 py-4">
          <div className="text-xl font-medium text-gray-900 dark:text-white">
            {format(selectedDate, 'EEEE')}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {format(selectedDate, 'MMMM d, yyyy')}
          </div>
        </div>

        <div 
          className="grid grid-cols-[100px_1fr] gap-4 overflow-y-auto max-h-[700px] relative"
          ref={calendarRef}
        >
          <div className="sticky left-0 bg-white dark:bg-gray-900 z-20">
            {hours.map((hour) => (
              <div 
                key={hour}
                className="text-right pr-4 text-sm text-gray-500 dark:text-gray-400"
                style={{ height: `${hourHeight}px` }}
              >
                {format(new Date().setHours(hour, 0), 'h:mm a')}
              </div>
            ))}
          </div>

          <div 
            className={`relative min-w-[300px] ${isEditable ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            onClick={() => isEditable && onAddEvent(selectedDate)}
          >
            {hours.map((hour) => (
              <div
                key={hour}
                className="border-t border-gray-200 dark:border-gray-700"
                style={{ height: `${hourHeight}px` }}
                data-current-day={hour === new Date().getHours() ? "true" : "false"}
              />
            ))}
            {isToday && (
              <div 
                ref={timeIndicatorRef}
                className="absolute left-0 right-0 z-10 pointer-events-none"
                style={{ 
                  top: `${(currentTime.getHours() + (currentTime.getMinutes() / 60)) * hourHeight}px` 
                }}
              >
                <div className="relative">
                  <div className="absolute -left-2 w-4 h-4 rounded-full bg-red-500"></div>
                  <div className="border-t-2 border-red-500 w-full"></div>
                </div>
              </div>
            )}
            {dayEvents.map((event) => {
              if (!isValidEventDate(event)) return null;

              return (
                <div
                  key={event.id}
                  className={`absolute left-0 right-0 mx-2 rounded-lg shadow-sm backdrop-blur-sm cursor-pointer transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/5 dark:hover:shadow-primary-500/10 z-20 ${
                    !isDateEditable(parseISO(event.start)) ? 'opacity-60' : ''
                  }`}
                  style={getEventStyle(event)}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEventClick(event);
                  }}
                >
                  <div className="p-2 text-white">
                    <div className="font-medium truncate block">{event.title}</div>
                    <div className="text-sm truncate">
                      {format(parseISO(event.start), 'h:mm a')} - {format(parseISO(event.end), 'h:mm a')}
                    </div>
                    {event.location && (
                      <div className="flex items-center mt-1 text-sm">
                        <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {view === 'month' && renderMonthView()}
      {view === 'week' && renderWeekView()}
      {view === 'day' && renderDayView()}
    </div>
  );
};

export default Calendar;