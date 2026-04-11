import { Calendar } from '@/components/calendar';
import { Toolbar } from '@/components/toolbar';
import { useCalendarApi } from '@/hooks/api/useCalendarApi';
import { Separator } from '@/components/ui/separator';
import { useCalendar } from './components/calendar/calendar';

function App() {
  const { month } = useCalendar();
  const { data, isLoading } = useCalendarApi({ month });

  return (
    <div className="relative flex h-full w-full flex-col">
      <Toolbar />
      <Separator />
      <Calendar events={data?.data} isLoading={isLoading} />
    </div>
  );
}

export default App;
