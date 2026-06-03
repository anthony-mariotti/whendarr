import { Route, Routes } from 'react-router';

// TODO: Remove once complete
import { CalendarView } from '@/components/calendar';
import { Toolbar } from '@/components/toolbar';

import { Layout } from '@/components/layout/Layout';

import { Upcoming } from '@/pages/Upcoming';
import { Calendar } from '@/pages/Calendar';
import { Preferences } from '@/pages/Preferences';

function AppOld() {
  return (
    <div className="relative flex h-full w-full flex-col">
      <Toolbar />
      <CalendarView />
    </div>
  );
}

function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Upcoming />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="preferences" element={<Preferences />} />
        </Route>
        <Route path="/old" element={<AppOld />} />
      </Routes>
    </>
  );
}

export default App;
