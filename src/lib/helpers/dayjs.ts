import dayjs, { type Dayjs } from 'dayjs';
import isTodayPlugin from 'dayjs/plugin/isToday';
import utcPlugin from 'dayjs/plugin/utc';
import relativeTimePlugin from 'dayjs/plugin/relativeTime';
import isBetweenPlugin from 'dayjs/plugin/isBetween';

dayjs.extend(isTodayPlugin);
dayjs.extend(utcPlugin);
dayjs.extend(relativeTimePlugin);
dayjs.extend(isBetweenPlugin);

export default dayjs;
export { type Dayjs };
