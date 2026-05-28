<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf'
  import MyButton from '../src/MyButton.svelte'

  const { Story } = defineMeta({
    title: 'Example/MyButton',
    component: MyButton,
    tags: ['autodocs'],
    argTypes: {
      label: { control: 'text' },
    },
  })
</script>

<Story name="Default" args={{ label: 'Click me' }} />

<Story name="Custom label" args={{ label: 'Crop' }} />

<Story name="With handler">
  {#snippet template(args)}
    <MyButton
      {...args}
      onclick={(count) => console.log('clicked', count)}
    />
  {/snippet}
</Story>
