  import dayjs, { type Dayjs } from 'dayjs';
  import isTodayExtension from 'dayjs/plugin/isToday';
  import utcExtension from 'dayjs/plugin/utc';

  dayjs.extend(isTodayExtension);
  dayjs.extend(utcExtension);

  export default dayjs;
  export {
    type Dayjs
  }