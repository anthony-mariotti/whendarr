import dayjs from 'dayjs';
import { Calendar } from '@/components/calendar';
import { Toolbar } from '@/components/toolbar';
import { useCalendar } from '@/hooks/api/useCalendar';
import { useState } from 'react';

function App() {
  const [selectedMonth, setSelectedMonth] = useState(dayjs());

  const { data, isLoading } = useCalendar({
    month: selectedMonth.startOf('month')
  });

  return (
    <div className="relative flex h-full w-full flex-col">
      <Toolbar
        selectedMonth={selectedMonth}
        onPrevMonth={() => setSelectedMonth((m) => m.subtract(1, 'month'))}
        onNextMonth={() => setSelectedMonth((m) => m.add(1, 'month'))}
        onToday={() => setSelectedMonth(dayjs())}
      />
      <Calendar selectedMonth={selectedMonth} events={data?.data} isLoading={isLoading} />
    </div>
  );
}

export default App;
