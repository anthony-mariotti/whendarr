<script lang="ts">
  import type {
    CalendarItem,
    TvCalendarItem,
    MovieCalendarItem
  } from '$lib/components/CalendarItem';
  import { onMount } from 'svelte';

  type CalendarDay = {
    date: string;
    dayNumber: number;
    releases: Array<CalendarItem>;
  } | null;
  $: scope = 'movie';
  $: loading = false;
  $: timeoutId = null as NodeJS.Timeout | null;

  $: items = [] as Array<CalendarItem>;
  $: calendarDays = [] as Array<CalendarDay>;

  const today = new Date();
  $: currentMonth = today.getMonth();
  $: currentYear = today.getFullYear();

  onMount(async () => {
    await generateCalendar();
  });

  async function generateCalendar() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (!loading) {
      timeoutId = setTimeout(() => {
        loading = true;
      }, 5);
    }

    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);

    const res = await fetch(
      `/api/calendar?scope=${scope}&start=${firstDay.toISOString().split('T')[0]}T00:00:00Z&end=${lastDay.toISOString().split('T')[0]}T23:59:59Z`
    );
    items = await res.json();

    const startDayOfWeek = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: Array<{ date: string; dayNumber: number; releases: Array<CalendarItem> } | null> =
      [];

    function releaseMapKeyPush(key: string, item: CalendarItem) {
      if (!releaseMap.has(key)) {
        releaseMap.set(key, []);
      }
      releaseMap.get(key)?.push(item);
    }

    function stripTimestamp(date: string): string {
        return date.split('T')[0];
    }

    // Pre-index releases by date (performance fix)
    const releaseMap = new Map<string, CalendarItem[]>();
    for (const item of items) {
      switch (item.type) {
        case 'tv':
          const key = stripTimestamp(item.date);
          releaseMapKeyPush(key, item);
          break;
        case 'movie':
          if (item.inCinemas) {
            releaseMapKeyPush(stripTimestamp(item.inCinemas), item);
          }
          if (item.physicalRelease) {
            releaseMapKeyPush(stripTimestamp(item.physicalRelease), item);
          }
          if (item.digitalRelease) {
            releaseMapKeyPush(stripTimestamp(item.digitalRelease), item);
          }
          break;
      }
    }

    // Leading blanks
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Month days
    for (let day = 1; day <= totalDays; day++) {
      const dateObj = new Date(currentYear, currentMonth, day);
      const iso = dateObj.toISOString().split('T')[0];

      days.push({
        date: iso,
        dayNumber: day,
        releases: releaseMap.get(iso) ?? []
      });
    }

    // Trailing blanks (full weeks)
    while (days.length % 7 !== 0) {
      days.push(null);
    }

    calendarDays = days;
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    loading = false;
  }

  async function changeMonth(offset: number) {
    currentMonth += offset;

    if (currentMonth < 0) {
      currentMonth = 11;
      currentYear--;
    }

    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }

    await generateCalendar();
  }

  $: monthLabel = () =>
    new Date(currentYear, currentMonth).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric'
    });

  $: isToday = (iso: string) => new Date(iso).toDateString() === today.toDateString();
</script>

<div class="relative mx-auto flex min-h-lvh flex-col p-6">
  <!-- Header -->
  <div class="mb-6 flex items-center justify-between">
    <button
      class="rounded bg-zinc-800 px-3 py-1 hover:bg-zinc-700"
      on:click={async () => changeMonth(-1)}
    >
      ←
    </button>

    <h1 class="text-2xl font-bold tracking-tight">
      {monthLabel()}
    </h1>

    <button
      class="rounded bg-zinc-800 px-3 py-1 hover:bg-zinc-700"
      on:click={async () => changeMonth(1)}
    >
      →
    </button>
  </div>

  <!-- Weekday Headers -->
  <div class="mb-2 grid grid-cols-7 text-center text-sm text-gray-400">
    <div>Sun</div>
    <div>Mon</div>
    <div>Tue</div>
    <div>Wed</div>
    <div>Thu</div>
    <div>Fri</div>
    <div>Sat</div>
  </div>

  <!-- Calendar Grid -->
  {@render renderCalendarGrid(calendarDays)}
</div>

{#snippet renderCalendarGrid(days: Array<CalendarDay>)}
  <div class="relative grow flex flex-col">
    {#if loading}
      <div class="absolute inset-0 z-10 flex items-center justify-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-loader-circle-icon lucide-loader-circle animate-spin"
          ><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg
        >
      </div>
    {/if}
    <div
      class={[
        'grid grid-cols-7 gap-0 overflow-hidden rounded-lg bg-zinc-900 py-px select-none grow',
        loading && 'blur-xs filter'
      ]}
    >
      {#each days as day}
        {#if day === null}
          <div class="min-h-30 bg-zinc-900 ring-1 ring-zinc-800"></div>
        {:else}
          <div
            class={[
              'flex min-h-32.5 flex-col border bg-zinc-900 p-2 transition hover:bg-zinc-800',
              isToday(day.date) ? 'border-green-500' : 'border-zinc-800',
              day.releases.length > 0 && 'shadow-lg'
            ]}
          >
            <!-- Day Number -->
            <div class="flex items-start justify-between">
              <span class="text-sm font-medium" class:text-green-400={isToday(day.date)}>
                {day.dayNumber}
              </span>

              {#if day.releases.length > 0}
                <span class="rounded bg-blue-600/20 px-2 py-0.5 text-xs text-blue-400">
                  {day.releases.length}
                </span>
              {/if}
            </div>

            <!-- Releases -->
            <div class="mt-2 space-y-1 overflow-hidden text-xs">
              {#each day.releases.slice(0, 3) as item}
                {@render renderCalendarItem(item, day.date)}
              {/each}

              {#if day.releases.length > 3}
                <div class="text-gray-500">
                  +{day.releases.length - 3} more
                </div>
              {/if}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </div>
{/snippet}

{#snippet renderCalendarItem(item: CalendarItem, day: string)}
  <div
    class={[
      'relative w-full items-center border-l-2 p-1 transition-colors',
      item.type === 'tv' && 'border-blue-500 bg-blue-500/15 hover:bg-blue-500/25',
      item.type === 'movie' && 'border-purple-500 bg-purple-500/15 hover:bg-purple-500/25'
    ]}
  >
    {#if item.type === 'tv'}
      {@render renderTvCalendarItem(item)}
    {:else if item.type === 'movie'}
      {@render renderMovieCalendarItem(item, day)}
    {/if}
  </div>
{/snippet}

{#snippet renderTvCalendarItem(item: TvCalendarItem)}
  <!-- {#each day.releases as item} -->

  <div class="truncate font-bold">
    {item.series}
  </div>

  <div class="flex">
    <div class="w-full truncate">
      {item.title}
    </div>
    <div class="">
      {item.season}x{item.episode}
    </div>
  </div>

  <div class="">
    {item.airTime}
  </div>
{/snippet}

{#snippet renderMovieCalendarItem(item: MovieCalendarItem, day: string)}
  <div class="truncate font-bold">
    {item.title}
  </div>

  <div class="">
    {#if item.digitalRelease?.split('T')[0] === day}
      Digital Release
    {:else if item.physicalRelease?.split('T')[0] === day}
      Physical Release
    {:else if item.inCinemas?.split('T')[0] === day}
      Cinema Release
    {:else}
      Unknown Release
    {/if}
  </div>
{/snippet}
