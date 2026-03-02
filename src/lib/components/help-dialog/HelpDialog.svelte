<script lang="ts">
  // shadcn-svelte
  import * as Dialog from '$lib/components/ui/dialog';
  import { Separator } from '$lib/components/ui/separator';
  import { Button, buttonVariants } from '$lib/components/ui/button';

  // lucide
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import GlobeIcon from '@lucide/svelte/icons/globe';
  import GitHubIcon from '@lucide/svelte/icons/github';
  import DiscordIcon from '../discord/DiscordIcon.svelte';

  let { appVersion }: { appVersion: string } = $props();
</script>

<Dialog.Root>
  <Dialog.Trigger type="button" class={buttonVariants({ variant: 'outline' })}>
    Help Me
  </Dialog.Trigger>
  <Dialog.Content>
    <Dialog.Header class="text-left">
      <Dialog.Title>Color Legend</Dialog.Title>
      <Dialog.Description>
        Guide to colors, and card types. Each card can clicked on to provide additional information.
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
        <div class="relative w-full items-center border-l-4 border-green-500 pl-2">Available</div>
        <div class="relative w-full items-center border-l-4 border-red-500 pl-2">Missing</div>
        <div class="relative w-full items-center border-l-4 border-blue-500 pl-2">Waiting</div>
        <div class="relative w-full items-center border-l-4 border-gray-500 pl-2">Ignored</div>
      </div>
    </div>
    <Separator class="mt-2" />
    <Dialog.Footer class="items-center justify-between sm:justify-between">
      <p>v{appVersion}</p>
      <div>
        <Button href="https://discord.gg/0000000000" target="_blank" variant="link" size="icon">
          <DiscordIcon />
        </Button>
        <Button
          href="https://docs.whendarr.com?utm_source=whendarr&utm_medium=icon&utm_campaign=help"
          target="_blank"
          variant="link"
          size="icon"
        >
          <BookOpenIcon />
        </Button>
        <Button
          href="https://whendarr.com?utm_source=whendarr&utm_medium=icon&utm_campaign=help"
          target="_blank"
          variant="link"
          size="icon"
        >
          <GlobeIcon />
        </Button>
        <Button
          href="https://github.com/anthony-mariotti/whendarr"
          target="_blank"
          variant="link"
          size="icon"
        >
          <GitHubIcon />
        </Button>
      </div>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
