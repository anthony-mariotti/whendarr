<script lang="ts">
  import { buildMonth, fetchCalendar, type CalendarDay } from '$lib/calendar';
  import type {
    CalendarItem,
    TvCalendarItem,
    MovieCalendarItem
  } from '$lib/components/CalendarItem';
  import { stripTimestamp } from '$lib/utils';
  import { onMount } from 'svelte';

  $: scope = '';
  $: loading = false;
  $: timeoutId = null as NodeJS.Timeout | null;

  $: items = [] as Array<CalendarItem>;
  $: calendarDays = [] as Array<CalendarDay>;

  const today = new Date();
  $: currentMonth = today.getMonth();
  $: currentYear = today.getFullYear();

  async function load() {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    if (!loading) {
      timeoutId = setTimeout(() => {
        loading = true;
      }, 5);
    }

    try {
      items = await fetchCalendar(currentYear, currentMonth, scope);
      calendarDays = buildMonth(currentYear, currentMonth, items);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      loading = false;
    }
  }

  onMount(load);

  async function changeScope(s: string) {
    scope = s;
    await load();
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

    await load();
  }

  $: monthLabel = () =>
    new Date(currentYear, currentMonth).toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric'
    });

  $: isToday = (iso: string) => new Date(iso).toDateString() === today.toDateString();

  function getItemBorderStyle(item: CalendarItem, day: string): string {
    if (item.type === 'movie') {
      if (stripTimestamp(item.inCinemas) === day) {
        return 'border-gray-500 bg-gray-500/15 hover:bg-gray-500/25';
      }

      if (item.hasFile) {
        return 'border-green-500 bg-orange-500/15 hover:bg-orange-500/25';
      } else {
        return 'border-red-500 bg-orange-500/15 hover:bg-orange-500/25';
      }
    }

    if (item.type === 'tv') {
      if (item.hasFile) {
        return 'border-green-500 bg-blue-500/15 hover:bg-blue-500/25 dark:bg-blue-500/15 dark:hover:bg-blue-500/25';
      } else {
        return 'border-red-500 bg-blue-500/15 hover:bg-blue-500/25 dark:bg-blue-500/15 dark:hover:bg-blue-500/25';
      }
    }

    return '';
  }
</script>

<div class="relative mx-auto flex min-h-lvh flex-col sm:p-6">
  <!-- Header -->
  <div class="mb-6 flex items-center justify-between">
    <button
      class="rounded bg-zinc-800 px-3 py-1 hover:bg-zinc-700"
      on:click={async () => changeMonth(-1)}
      aria-label="Previous Month"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-arrow-left-icon lucide-arrow-left"
        ><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg
      >
    </button>

    <div class="relative flex">
      <h1 class={['text-2xl font-bold tracking-tight', loading && 'blur-xs filter']}>
        {monthLabel()}
      </h1>

      {#if loading}
        <div class="absolute inset-0 z-10 flex items-center justify-center text-white">
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
    </div>

    <div>
      <button
        class="rounded bg-zinc-800 px-3 py-1 hover:bg-zinc-700"
        on:click={async () => changeScope('movie')}
      >
        Movie
      </button>
      <button
        class="rounded bg-zinc-800 px-3 py-1 hover:bg-zinc-700"
        on:click={async () => changeScope('tv')}
      >
        Tv
      </button>
      <button
        class="rounded bg-zinc-800 px-3 py-1 hover:bg-zinc-700"
        on:click={async () => changeScope('')}
      >
        All
      </button>
    </div>

    <button
      class="rounded bg-zinc-800 px-3 py-1 hover:bg-zinc-700"
      on:click={async () => changeMonth(1)}
      aria-label="Next Month"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="lucide lucide-arrow-right-icon lucide-arrow-right"
        ><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg
      >
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
  <div class="relative flex grow flex-col">
    <div
      class={[
        'grid grow grid-cols-7 gap-0 overflow-hidden sm:rounded-lg bg-zinc-900 py-px select-none',
        loading && 'blur-xs filter'
      ]}
    >
      {#each days as day}
        {#if day === null}
          <div
            class="min-h-30 bg-zinc-100 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-800"
          ></div>
        {:else}
          <div
            class={[
              'flex min-h-32.5 flex-col border bg-zinc-100 p-2 transition hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800',
              isToday(day.date) ? 'border-green-500' : 'border-zinc-200 dark:border-zinc-800'
            ]}
          >
            <!-- Day Number -->
            <div class="flex items-start justify-between">
              <span class={['text-sm font-medium', isToday(day.date) && 'text-green-400']}>
                {day.dayNumber}
              </span>

              <!-- {#if day.releases.length > 0}
                <span class="rounded bg-gray-600/20 px-2 py-0.5 text-xs text-gray-400 hidden sm:inline">
                  {day.releases.length}
                </span>
              {/if} -->
            </div>

            <!-- Releases -->
            <div class="mt-2 space-y-1 overflow-hidden text-xs">
              {#each day.releases.slice(0, 2) as item}
              <!-- {#each day.releases as item} -->
                {@render renderCalendarItem(item, day.date)}
              {/each}

              {#if day.releases.length > 2}
                <div class="text-gray-500 text-center">
                  +{day.releases.length - 2}
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
      'relative w-full items-center border-l-4 p-1 transition-colors',
      getItemBorderStyle(item, day)
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

  <div class="flex gap-1">
    <div class="w-full truncate font-bold" title={item.series}>
      {item.series}
    </div>
    {#if item.episode === 1}
      <span
        class="hidden sm:inline-flex items-center rounded-md bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-nowrap text-blue-700 dark:bg-blue-400/10 dark:text-blue-400"
      >
        Season Premere
      </span>
    {/if}
  </div>

  <div class="hidden sm:flex">
    <div class="w-full truncate" title={item.title}>
      {item.title}
    </div>
    <div class="">
      {item.season}x{item.episode}
    </div>
  </div>

  <div class="hidden sm:flex">
    {item.airTime}
  </div>
{/snippet}

{#snippet renderMovieCalendarItem(item: MovieCalendarItem, day: string)}
  <div class="truncate font-bold">
    {item.title}
  </div>

  <div class="hidden sm:flex">
    {#if stripTimestamp(item.digitalRelease) === day}
      Digital Release
    {:else if stripTimestamp(item.physicalRelease) === day}
      Physical Release
    {:else if stripTimestamp(item.inCinemas) === day}
      Cinema Release
    {:else}
      Unknown Release
    {/if}
  </div>
{/snippet}
