<script lang="ts">
  import { buildMonth, fetchCalendar, type CalendarDay } from '$lib/calendar';
  import type {
    CalendarItem,
    TvCalendarItem,
    MovieCalendarItem
  } from '$lib/components/CalendarItem';
  import { stripTimestamp } from '$lib/utils';
  import { onMount } from 'svelte';

  import { Button } from '$lib/components/ui/button';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import * as Popover from '$lib/components/ui/popover';
  import * as Collapsible from '$lib/components/ui/collapsible';

  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import { ToggleTheme } from '$lib/components/toggle-theme';
  import { Badge } from '$lib/components/ui/badge';

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

  function movieRelease(item: MovieCalendarItem, day: string) {
    if (stripTimestamp(item.inCinemas) === day) {
        return 'Cinema';
    }
    if (stripTimestamp(item.digitalRelease) === day) {
        return 'Digital';
    }
    if (stripTimestamp(item.physicalRelease) === day) {
        return 'Physical';
    }
    return 'Unknown';
  }
</script>

<div class="relative mx-auto flex min-h-lvh flex-col pt-6 sm:p-6">
  <div class="mb-6 flex items-center justify-center gap-4">
    <ToggleTheme />
    <ToggleGroup.Root
      type="single"
      onValueChange={async (e) => await changeScope(e)}
      variant="outline"
      value="all"
    >
      <ToggleGroup.Item value="all">All</ToggleGroup.Item>
      <ToggleGroup.Item value="movie">Movie</ToggleGroup.Item>
      <ToggleGroup.Item value="tv">Tv</ToggleGroup.Item>
    </ToggleGroup.Root>
  </div>

  <!-- Header -->
  <div class="mb-4 flex items-center justify-between p-6 sm:p-0">
    <Button size="icon" onclick={async () => await changeMonth(-1)} aria-label="Previous Month">
      <ArrowLeftIcon />
    </Button>

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

    <Button size="icon" onclick={async () => await changeMonth(1)} aria-label="Next Month">
      <ArrowRightIcon />
    </Button>
  </div>

  <!-- Weekday Headers -->
  <div class="mb-2 grid grid-cols-7 text-center text-sm">
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
        'grid grow grid-cols-7 gap-0 overflow-hidden bg-accent py-px select-none sm:rounded-lg',
        loading && 'blur-xs filter'
      ]}
    >
      {#each days as day}
        {#if day === null}
          <div class="min-h-30 bg-neutral-200 dark:bg-neutral-900"></div>
        {:else}
          <div
            class={[
              'flex min-h-32.5 flex-col p-2 transition',
              isToday(day.date) ? 'border-2 border-green-500' : 'border'
            ]}
          >
            <!-- Day Number -->
            <div class="flex items-start justify-between">
              <span class={['text-sm font-medium', isToday(day.date) && 'text-green-500']}>
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
                <Popover.Root>
                  <Popover.Trigger>
                    {#snippet child({ props })}
                      {@render renderCalendarItem(props, item, day.date)}
                    {/snippet}
                  </Popover.Trigger>
                  <Popover.Content>
                    {#if item.type === 'tv'}
                      <div class="flex items-center justify-between">
                        <h1 class="text-lg font-bold">{item.series}</h1>
                        {#if item.episode === 1}
                          <Badge variant="outline">Season Premere</Badge>
                        {/if}
                      </div>
                      <div class="flex items-center justify-between">
                        <h2>{item.title}</h2>
                        <span>{item.season}x{item.episode}</span>
                      </div>
                    {/if}
                    {#if item.type === 'movie'}
                      <div class="flex items-center justify-between">
                        <h1 class="text-lg font-bold">{item.title}</h1>
                      </div>
                      <div class="flex items-center justify-between">
                        <h2>{movieRelease(item, day.date)} Release</h2>
                      </div>
                    {/if}
                  </Popover.Content>
                </Popover.Root>
              {/each}

              {#if day.releases.length > 2}
                <Collapsible.Root>
                  <Collapsible.Content class="space-y-1">
                    {#each day.releases.slice(2) as item}
                      <!-- {#each day.releases as item} -->
                      <Popover.Root>
                        <Popover.Trigger>
                          {#snippet child({ props })}
                            {@render renderCalendarItem(props, item, day.date)}
                          {/snippet}
                        </Popover.Trigger>
                        <Popover.Content>
                          {#if item.type === 'tv'}
                            <div class="flex items-center justify-between">
                              <h1 class="text-lg font-bold">{item.series}</h1>
                              {#if item.episode === 1}
                                <Badge variant="outline">Season Premere</Badge>
                              {/if}
                            </div>
                            <div class="flex items-center justify-between">
                              <h2>{item.title}</h2>
                              <span>{item.season}x{item.episode}</span>
                            </div>
                          {/if}
                          {#if item.type === 'movie'}
                            <h1 class="text-lg font-bold">{item.title}</h1>
                          {/if}
                        </Popover.Content>
                      </Popover.Root>
                    {/each}
                  </Collapsible.Content>
                  <Collapsible.Trigger class="group">
                    <div class="text-center text-neutral-500 group-data-[state=open]:hidden">
                      +{day.releases.length - 2}
                    </div>
                    <div class="hidden text-center text-neutral-500 group-data-[state=open]:block">
                      less
                    </div>
                  </Collapsible.Trigger>
                </Collapsible.Root>
              {/if}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </div>
{/snippet}

{#snippet renderCalendarItem(props: Record<string, unknown>, item: CalendarItem, day: string)}
  <div
    {...props}
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

  <div class="flex items-center justify-between">
    <div class="w-full truncate font-bold" title={item.series}>
      {item.series}
    </div>
    {#if item.episode === 1}
      <div class="hidden lg:block">
        <Badge variant="outline">Season Premere</Badge>
      </div>
    {/if}
  </div>

  <div class="hidden items-center justify-between sm:flex">
    <div class="hidden w-full truncate lg:block" title={item.title}>
      {item.title}
    </div>
    <div class="">
      {item.season}x{item.episode}
    </div>
  </div>

  <div class="hidden lg:flex">
    {item.airTime}
  </div>
{/snippet}

{#snippet renderMovieCalendarItem(item: MovieCalendarItem, day: string)}
  <div class="truncate font-bold">
    {item.title}
  </div>

  <div class="hidden sm:flex">
    {movieRelease(item, day)} <span class="hidden lg:inline">&nbsp;Release</span>
  </div>
{/snippet}
