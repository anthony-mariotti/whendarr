import { Calendar } from '@/components/calendar';
import { Toolbar } from '@/components/toolbar';

function App() {
  return (
    <div className="relative flex h-full w-full flex-col">
      <Toolbar />
      <Calendar />
    </div>
  );
}

export default App;
