import type { CalendarItem } from '@whendarr/shared';
import { Button } from './ui/button';

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sun) - 6 (Sat)
  d.setDate(d.getDate() - day);
  return d;
}

function endOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (6 - day));
  return d;
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function getMonthDays(date: Date) {
  const start = startOfWeek(startOfMonth(date));
  const end = endOfWeek(endOfMonth(date));

  const days = [];
  let current = start;

  while (current <= end) {
    days.push(new Date(current));
    current = addDays(current, 1);
  }

  return days;
}

function chunk(array: Date[], size: number) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

interface CalendarProps {
  events?: CalendarItem[];
  isLoading?: boolean;
}

function Calendar({ events, isLoading }: CalendarProps) {
  const date = new Date();
  const days = getMonthDays(date);
  const weeks = chunk(days, 7);

  return (
    <div className="flex h-full flex-col">
      <div className="flex">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="m-0 flex-1 p-3 text-center text-lg text-ellipsis">
            <h1 className="font-semibold">{d}</h1>
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col">
        {weeks.map((week, i) => (
          <div
            key={i}
            className="flex h-full w-full flex-1 flex-col border-t border-black last:border-b"
          >
            <div className="flex h-full w-full">
              {week.map((day, j) => {
                const dayEvents = events?.filter((e) => isSameDay(new Date(e.date), day));

                return (
                  <div className="relative flex h-full w-full flex-1 flex-col overflow-hidden border-l border-black last:border-r">
                    <h2 key={j} className="text-center">
                      {day.getDate() === 1 ? day.toLocaleString('default', { month: 'short' }) : ''}{' '}
                      {day.getDate()}
                    </h2>
                    <div className="flex h-full w-full flex-1 flex-col flex-nowrap space-y-1 p-1">
                      {dayEvents?.map((event, idx) => (
                        <div className="pointer-events-none border-l-4 border-amber-500 bg-amber-100 p-1 text-sm">
                          <h3 className="truncate">{event.title}</h3>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* <div className="flex h-full w-full">
              {week.map((day, j) => {
                const dayEvents = events?.filter((e) => isSameDay(new Date(e.date), day))
                return (
                  dayEvents?.map((event, idx) => (
                    <div key={`${j}-${idx}`} className="flex-1">{event.title}</div>
                  ))
                );
              })}
            </div> */}
          </div>
        ))}
      </div>
    </div>
  );
}

export { Calendar };
