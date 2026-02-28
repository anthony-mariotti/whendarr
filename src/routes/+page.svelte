<script lang="ts">
  import { buildMonth, fetchCalendar, type CalendarDay } from '$lib/calendar';
  import type {
    CalendarItem,
    TvCalendarItem,
    MovieCalendarItem
  } from '$lib/components/CalendarItem';
  import { onMount } from 'svelte';

  import { Button, buttonVariants } from '$lib/components/ui/button';
  import * as ToggleGroup from '$lib/components/ui/toggle-group';
  import * as Collapsible from '$lib/components/ui/collapsible';
  import * as Dialog from '$lib/components/ui/dialog';

  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
  import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';
  import CircleLoaderIcon from '@lucide/svelte/icons/loader-circle';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

  import { ToggleTheme } from '$lib/components/toggle-theme';
  import { Badge } from '$lib/components/ui/badge';

  import dayjs, { type Dayjs } from '$lib/helpers/dayjs';
  import { Separator } from '$lib/components/ui/separator';

  let today = $state(dayjs());

  let scope = $state('');
  let loading = $state(false);
  let timeoutId = $state<NodeJS.Timeout | null>(null);

  let items = $state<Array<CalendarItem>>([]);
  let calendarDays = $state<Array<CalendarDay>>([]);

  let currentDate = $state(dayjs().local());

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
      items = await fetchCalendar(currentDate, scope);
      calendarDays = buildMonth(currentDate, items);
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
    currentDate = currentDate.add(offset, 'month');

    await load();
  }

  function getItemBorderStyle(item: CalendarItem, day: Dayjs): string {
    if (item.type === 'movie') {
      if (dayjs(item.inCinemas).isSame(day, 'date')) {
        return 'border-gray-500 bg-gray-500/15 hover:bg-gray-500/25';
      }

      if (item.hasFile) {
        return 'border-green-500 bg-orange-500/15 hover:bg-orange-500/25';
      } else if (
        (!item.hasFile && dayjs(item.digitalRelease).isAfter(today)) ||
        dayjs(item.physicalRelease).isAfter(today)
      ) {
        return 'border-blue-500 bg-orange-500/15 hover:bg-orange-500/25';
      } else {
        return 'border-red-500 bg-orange-500/15 hover:bg-orange-500/25';
      }
    }

    if (item.type === 'tv') {
      if (item.hasFile) {
        return 'border-green-500 bg-blue-500/15 hover:bg-blue-500/25 dark:bg-blue-500/15 dark:hover:bg-blue-500/25';
      } else if (!item.hasFile && dayjs(item.date).isAfter(today)) {
        return 'border-blue-500 bg-blue-500/15 hover:bg-blue-500/25 dark:bg-blue-500/15 dark:hover:bg-blue-500/25';
      } else {
        return 'border-red-500 bg-blue-500/15 hover:bg-blue-500/25 dark:bg-blue-500/15 dark:hover:bg-blue-500/25';
      }
    }

    return '';
  }

  function movieRelease(item: MovieCalendarItem, day: Dayjs) {
    if (dayjs.utc(item.inCinemas).local().isSame(day, 'date')) {
      return 'Cinema';
    }
    if (dayjs.utc(item.digitalRelease).local().isSame(day, 'date')) {
      return 'Digital';
    }
    if (dayjs.utc(item.physicalRelease).local().isSame(day, 'date')) {
      return 'Physical';
    }
    return 'Unknown';
  }

  function getUniqueItemId(item: CalendarItem, day: Dayjs) {
    if (item.type === 'movie') {
      return `${item.type}-${item.id}-${movieRelease(item, day).toLowerCase()}`;
    }
    if (item.type === 'tv') {
      return `${item.type}-${item.id}-${item.seriesId}`;
    }
  }
</script>

<div class="wrapper">
  <div class="wrapper__header">
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
    <Dialog.Root>
      <Dialog.Trigger type="button" class={buttonVariants({ variant: 'outline' })}>
        Help Me
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Color Legend</Dialog.Title>
          <Dialog.Description>
            Guide to colors, and card types. Each card can clicked on to provide additional
            information.
          </Dialog.Description>
        </Dialog.Header>
        <div class="space-y-4">
          <div class="space-y-2">
            <h2 class="font-bold">Cards</h2>
            <div
              class="relative w-full items-center border-l-4 bg-blue-500/15 p-1 transition-colors hover:bg-blue-500/25 dark:bg-blue-500/15 dark:hover:bg-blue-500/25"
            >
              <div class="flex flex-col justify-center">
                <h1 class="text-lg font-bold">TV Series</h1>
                <div class="flex items-center justify-between">
                  <h2>Episode Title</h2>
                  <span>1x99</span>
                </div>
              </div>
            </div>
            <div
              class="relative w-full items-center border-l-4 bg-orange-500/15 p-1 transition-colors hover:bg-orange-500/25"
            >
              <div class="flex flex-col justify-center">
                <h1 class="text-lg font-bold">Movie</h1>
                <div class="flex items-center justify-between">
                  <h2>Release</h2>
                </div>
              </div>
            </div>
          </div>
          <Separator />
          <div class="space-y-2">
            <h2 class="font-bold">Colors</h2>
            <div class="relative w-full items-center border-l-4 border-green-500 pl-2">
              Available
            </div>
            <div class="relative w-full items-center border-l-4 border-red-500 pl-2">Missing</div>
            <div class="relative w-full items-center border-l-4 border-blue-500 pl-2">Waiting</div>
            <div class="relative w-full items-center border-l-4 border-gray-500 pl-2">Ignored</div>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Root>
  </div>
  <div class="wrapper__control">
    <Button size="icon-lg" onclick={async () => await changeMonth(-1)} aria-label="Previous Month">
      <ArrowLeftIcon />
    </Button>
    <div class="relative">
      <h1 class={['text-2xl font-bold tracking-tight', loading && 'blur-xs filter']}>
        {currentDate.format('MMMM')}
        {currentDate.format('YYYY')}
      </h1>
      {#if loading}
        <div class="absolute inset-0 z-10 flex items-center justify-center text-white">
          <CircleLoaderIcon class="animate-spin" />
        </div>
      {/if}
    </div>
    <Button size="icon-lg" onclick={async () => await changeMonth(1)} aria-label="Next Month">
      <ArrowRightIcon />
    </Button>
  </div>
  <div class="wrapper_calendar">
    <div class="grid grid-cols-7 text-center text-sm">
      <div>Sun</div>
      <div>Mon</div>
      <div>Tue</div>
      <div>Wed</div>
      <div>Thu</div>
      <div>Fri</div>
      <div>Sat</div>
    </div>
    {@render renderCalendarGrid(calendarDays)}
  </div>
</div>

{#snippet renderCalendarGrid(days: Array<CalendarDay>)}
  <div
    class={[
      'grid grid-cols-7 gap-0 overflow-hidden bg-accent py-px select-none sm:rounded-lg',
      loading && 'blur-xs filter'
    ]}
  >
    {#each days as day, i (day?.dayNumber ?? i + 100)}
      {#if day === null}
        <div class="min-h-30 bg-neutral-200 dark:bg-neutral-900"></div>
      {:else}
        <div
          class={[
            'flex min-h-32.5 flex-col p-2 transition',
            day.date.isToday() ? 'border-2 border-green-500' : 'border'
          ]}
        >
          <!-- Day Number -->
          <div class="flex items-start justify-between">
            <span class={['text-sm font-medium', day.date.isToday() && 'text-green-500']}>
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
            {#each day.releases.slice(0, 2) as item (getUniqueItemId(item, day.date))}
              <!-- {#each day.releases as item} -->
              {@render renderCalendarItem(item, day.date)}
            {/each}

            {#if day.releases.length > 2}
              <Collapsible.Root>
                <Collapsible.Content class="space-y-1">
                  {#each day.releases.slice(2) as item (getUniqueItemId(item, day.date))}
                    <!-- {#each day.releases as item} -->
                    {@render renderCalendarItem(item, day.date)}
                  {/each}
                </Collapsible.Content>
                <Collapsible.Trigger class="group w-full">
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
{/snippet}

{#snippet renderCalendarItem(item: CalendarItem, day: Dayjs)}
  <Dialog.Root>
    <Dialog.Trigger>
      {#snippet child({ props })}
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
    </Dialog.Trigger>
    <Dialog.Content>
      <Dialog.Header class="text-left">
        {#if item.type === 'tv'}
          <Dialog.Title>
            <h1 class="text-xl">{item.series}</h1>
          </Dialog.Title>
          <Dialog.Description class="flex items-center space-x-1">
            <p class="w-min rounded border-2 px-1 text-nowrap">{item.certification}</p>
            <p>
              {item.season.toString().padStart(2, '0')}x{item.episode.toString().padStart(2, '0')}
            </p>
          </Dialog.Description>
        {:else if item.type === 'movie'}
          <Dialog.Title>
            <h1 class="text-xl">{item.title}</h1>
          </Dialog.Title>
          <Dialog.Description class="flex items-center space-x-1">
            <p class="w-min rounded border-2 px-1 text-nowrap">{item.certification}</p>
            <p>{movieRelease(item, day)} Release</p>
          </Dialog.Description>
        {/if}
      </Dialog.Header>
      <Separator />
      {#if item.type === 'tv'}
        <div class="space-y-2">
          <h2 class="text-xl">{item.title}</h2>
          <p class="text-muted-foreground">{item.overview}</p>
        </div>
      {:else if item.type === 'movie'}
        <div class="space-y-2">
          <h2 class="text-xl">Overview</h2>
          <p class="text-muted-foreground">{item.overview}</p>
        </div>
      {/if}
    </Dialog.Content>
  </Dialog.Root>
{/snippet}

{#snippet renderTvCalendarItem(item: TvCalendarItem)}
  <div class="flex items-center justify-between">
    <h1 class="truncate font-bold lg:text-sm" title={item.series}>{item.series}</h1>
    {#if item.episode === 1}
      <div class="hidden lg:block">
        <Badge variant="outline">Season Premiere</Badge>
      </div>
    {/if}
  </div>

  <div class="hidden items-center justify-between sm:flex">
    <div class="hidden w-full truncate lg:block" title={item.title}>
      {item.title}
    </div>
    <div class="">
      {item.season.toString().padStart(2, '0')}x{item.episode.toString().padStart(2, '0')}
    </div>
  </div>
{/snippet}

{#snippet renderMovieCalendarItem(item: MovieCalendarItem, day: Dayjs)}
  <div class="flex items-center justify-between">
    <h1 class="truncate font-bold lg:text-sm" title={item.title}>{item.title}</h1>
    {#if item.qualityNotMet}
      <span title="Quality Not Met">
        <TriangleAlertIcon class="h-4 w-4" />
      </span>
    {/if}
  </div>

  <div class="hidden items-center justify-between sm:flex">
    <span>{movieRelease(item, day)} <span class="hidden lg:inline">Release</span></span>
    <span class="hidden w-min rounded border-2 px-1 text-nowrap lg:inline"
      >{item.certification ?? 'NOT RATED'}</span
    >
  </div>
{/snippet}

<style lang="postcss">
  @reference "tailwindcss";

  .wrapper {
    @apply grid max-h-lvh min-h-svh gap-2 pt-2;
    grid-template-columns: 1fr;
    grid-template-rows: min-content min-content 1fr;
    grid-template-areas:
      'header'
      'control'
      'calendar';
  }

  /* .wrapper > * {
    @apply border border-red-500;
  } */

  .wrapper__header {
    grid-area: header;
    @apply flex items-center justify-center space-x-2;
  }

  .wrapper__control {
    grid-area: control;
    @apply flex items-center justify-between px-4;
  }

  .wrapper_calendar {
    grid-area: calendar;
    grid-template-columns: 1fr;
    grid-template-rows: min-content 1fr;
    @apply grid gap-2;
  }
</style>
