import { Calendar } from '@/components/calendar';
import { Toolbar } from '@/components/toolbar';
import { Separator } from '@/components/ui/separator';

function App() {
  return (
    <div className="relative flex h-full w-full flex-col">
      <Toolbar />
      <Separator />
      <Calendar />
    </div>
  );
}

export default App;
