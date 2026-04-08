import { Calendar } from './components/calendar';
import { Toolbar } from './components/toolbar';
import { useCalendar } from './hooks/api/useCalendar';

function App() {
  const { data, isLoading } = useCalendar();

  return (
    <div className="h-full w-full">
      <Toolbar />
      <Calendar events={data?.data} isLoading={isLoading} />
    </div>
  );
}

export default App;
