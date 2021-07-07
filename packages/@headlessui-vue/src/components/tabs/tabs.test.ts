import { defineComponent, nextTick } from 'vue'
import { render } from '../../test-utils/vue-testing-library'
import { Tabs, TabsList, TabsTab, TabsPanels, TabsPanel } from './tabs'
import { suppressConsoleLogs } from '../../test-utils/suppress-console-logs'
import {
  assertActiveElement,
  assertTabs,
  getByText,
  getTabs,
} from '../../test-utils/accessibility-assertions'
import { click, press, shift, Keys } from '../../test-utils/interactions'
import { html } from '../../test-utils/html'

jest.mock('../../hooks/use-id')

beforeAll(() => {
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation(setImmediate as any)
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(clearImmediate as any)
})

afterAll(() => jest.restoreAllMocks())

function renderTemplate(input: string | Partial<Parameters<typeof defineComponent>[0]>) {
  let defaultComponents = { Tabs, TabsList, TabsTab, TabsPanels, TabsPanel }

  if (typeof input === 'string') {
    return render(defineComponent({ template: input, components: defaultComponents }))
  }

  return render(
    defineComponent(
      Object.assign({}, input, {
        components: { ...defaultComponents, ...input.components },
      }) as Parameters<typeof defineComponent>[0]
    )
  )
}

describe('safeguards', () => {
  it.each([
    ['TabsList', TabsList],
    ['TabsTab', TabsTab],
    ['TabsPanels', TabsPanels],
    ['TabsPanel', TabsPanel],
  ])(
    'should error when we are using a <%s /> without a parent <Tabs /> component',
    suppressConsoleLogs((name, Component) => {
      expect(() => render(Component)).toThrowError(
        `<${name} /> is missing a parent <Tabs /> component.`
      )
    })
  )

  it('should be possible to render Tabs without crashing', async () => {
    renderTemplate(
      html`
        <Tabs>
          <TabsList>
            <TabsTab>Tab 1</TabsTab>
            <TabsTab>Tab 2</TabsTab>
            <TabsTab>Tab 3</TabsTab>
          </TabsList>

          <TabsPanels>
            <TabsPanel>Content 1</TabsPanel>
            <TabsPanel>Content 2</TabsPanel>
            <TabsPanel>Content 3</TabsPanel>
          </TabsPanels>
        </Tabs>
      `
    )

    await new Promise<void>(nextTick)

    assertTabs({ active: 0 })
  })
})

describe('Rendering', () => {
  it('should be possible to render the TabsPanels first, then the TabsList', async () => {
    renderTemplate(
      html`
        <Tabs>
          <TabsPanels>
            <TabsPanel>Content 1</TabsPanel>
            <TabsPanel>Content 2</TabsPanel>
            <TabsPanel>Content 3</TabsPanel>
          </TabsPanels>

          <TabsList>
            <TabsTab>Tab 1</TabsTab>
            <TabsTab>Tab 2</TabsTab>
            <TabsTab>Tab 3</TabsTab>
          </TabsList>
        </Tabs>
      `
    )

    await new Promise<void>(nextTick)

    assertTabs({ active: 0 })
  })

  describe('`renderProps`', () => {
    it('should expose the `selectedIndex` on the `Tabs` component', async () => {
      renderTemplate(
        html`
          <Tabs v-slot="data">
            <pre id="exposed">{{JSON.stringify(data)}}</pre>

            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>
        `
      )

      await new Promise<void>(nextTick)

      expect(document.getElementById('exposed')).toHaveTextContent(
        JSON.stringify({ selectedIndex: 0 })
      )

      await click(getByText('Tab 2'))

      expect(document.getElementById('exposed')).toHaveTextContent(
        JSON.stringify({ selectedIndex: 1 })
      )
    })

    it('should expose the `selectedIndex` on the `TabsList` component', async () => {
      renderTemplate(
        html`
          <Tabs>
            <TabsList v-slot="data">
              <pre id="exposed">{{JSON.stringify(data)}}</pre>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>
        `
      )

      await new Promise<void>(nextTick)

      expect(document.getElementById('exposed')).toHaveTextContent(
        JSON.stringify({ selectedIndex: 0 })
      )

      await click(getByText('Tab 2'))

      expect(document.getElementById('exposed')).toHaveTextContent(
        JSON.stringify({ selectedIndex: 1 })
      )
    })

    it('should expose the `selectedIndex` on the `TabsPanels` component', async () => {
      renderTemplate(
        html`
          <Tabs>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels v-slot="data">
              <pre id="exposed">{{JSON.stringify(data)}}</pre>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>
        `
      )

      await new Promise<void>(nextTick)

      expect(document.getElementById('exposed')).toHaveTextContent(
        JSON.stringify({ selectedIndex: 0 })
      )

      await click(getByText('Tab 2'))

      expect(document.getElementById('exposed')).toHaveTextContent(
        JSON.stringify({ selectedIndex: 1 })
      )
    })

    it('should expose the `selected` state on the `TabsTab` components', async () => {
      renderTemplate(
        html`
          <Tabs>
            <TabsList>
              <TabsTab v-slot="data">
                <pre data-tab="0">{{JSON.stringify(data)}}</pre>
                <span>Tab 1</span>
              </TabsTab>
              <TabsTab v-slot="data">
                <pre data-tab="1">{{JSON.stringify(data)}}</pre>
                <span>Tab 2</span>
              </TabsTab>
              <TabsTab v-slot="data">
                <pre data-tab="2">{{JSON.stringify(data)}}</pre>
                <span>Tab 3</span>
              </TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>
        `
      )

      await new Promise<void>(nextTick)

      expect(document.querySelector('[data-tab="0"]')).toHaveTextContent(
        JSON.stringify({ selected: true })
      )
      expect(document.querySelector('[data-tab="1"]')).toHaveTextContent(
        JSON.stringify({ selected: false })
      )
      expect(document.querySelector('[data-tab="2"]')).toHaveTextContent(
        JSON.stringify({ selected: false })
      )

      await click(getTabs()[1])

      expect(document.querySelector('[data-tab="0"]')).toHaveTextContent(
        JSON.stringify({ selected: false })
      )
      expect(document.querySelector('[data-tab="1"]')).toHaveTextContent(
        JSON.stringify({ selected: true })
      )
      expect(document.querySelector('[data-tab="2"]')).toHaveTextContent(
        JSON.stringify({ selected: false })
      )
    })

    it('should expose the `selected` state on the `TabsPanel` components', async () => {
      renderTemplate(
        html`
          <Tabs>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel :unmount="false" v-slot="data">
                <pre data-panel="0">{{JSON.stringify(data)}}</pre>
                <span>Content 1</span>
              </TabsPanel>
              <TabsPanel :unmount="false" v-slot="data">
                <pre data-panel="1">{{JSON.stringify(data)}}</pre>
                <span>Content 2</span>
              </TabsPanel>
              <TabsPanel :unmount="false" v-slot="data">
                <pre data-panel="2">{{JSON.stringify(data)}}</pre>
                <span>Content 3</span>
              </TabsPanel>
            </TabsPanels>
          </Tabs>
        `
      )

      await new Promise<void>(nextTick)

      expect(document.querySelector('[data-panel="0"]')).toHaveTextContent(
        JSON.stringify({ selected: true })
      )
      expect(document.querySelector('[data-panel="1"]')).toHaveTextContent(
        JSON.stringify({ selected: false })
      )
      expect(document.querySelector('[data-panel="2"]')).toHaveTextContent(
        JSON.stringify({ selected: false })
      )

      await click(getByText('Tab 2'))

      expect(document.querySelector('[data-panel="0"]')).toHaveTextContent(
        JSON.stringify({ selected: false })
      )
      expect(document.querySelector('[data-panel="1"]')).toHaveTextContent(
        JSON.stringify({ selected: true })
      )
      expect(document.querySelector('[data-panel="2"]')).toHaveTextContent(
        JSON.stringify({ selected: false })
      )
    })
  })

  describe('`defaultIndex`', () => {
    it('should jump to the nearest tab when the defaultIndex is out of bounds (-2)', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="-2">
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)

      assertTabs({ active: 0 })
      assertActiveElement(getByText('Tab 1'))
    })

    it('should jump to the nearest tab when the defaultIndex is out of bounds (+5)', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="5">
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)

      assertTabs({ active: 2 })
      assertActiveElement(getByText('Tab 3'))
    })

    it('should jump to the next available tab when the defaultIndex is a disabled tab', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="0">
            <TabsList>
              <TabsTab disabled>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)

      assertTabs({ active: 1 })
      assertActiveElement(getByText('Tab 2'))
    })

    it('should jump to the next available tab when the defaultIndex is a disabled tab and wrap around', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="2">
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab disabled>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)

      assertTabs({ active: 0 })
      assertActiveElement(getByText('Tab 1'))
    })
  })
})

describe('Keyboard interactions', () => {
  describe('`Tab` key', () => {
    it('should be possible to tab to the default initial first tab', async () => {
      renderTemplate(
        html`
          <Tabs>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)

      assertTabs({ active: 0 })
      assertActiveElement(getByText('Tab 1'))

      await press(Keys.Tab)
      assertActiveElement(getByText('Content 1'))

      await press(Keys.Tab)
      assertActiveElement(getByText('after'))

      await press(shift(Keys.Tab))
      assertActiveElement(getByText('Content 1'))

      await press(shift(Keys.Tab))
      assertActiveElement(getByText('Tab 1'))
    })

    it('should be possible to tab to the default index tab', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="1">
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)

      assertTabs({ active: 1 })
      assertActiveElement(getByText('Tab 2'))

      await press(Keys.Tab)
      assertActiveElement(getByText('Content 2'))

      await press(Keys.Tab)
      assertActiveElement(getByText('after'))

      await press(shift(Keys.Tab))
      assertActiveElement(getByText('Content 2'))

      await press(shift(Keys.Tab))
      assertActiveElement(getByText('Tab 2'))
    })
  })

  describe('`ArrowRight` key', () => {
    it('should be possible to go to the next item (activation = `auto`)', async () => {
      renderTemplate(
        html`
          <Tabs>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 0 })

      await press(Keys.ArrowRight)
      assertTabs({ active: 1 })

      await press(Keys.ArrowRight)
      assertTabs({ active: 2 })
    })

    it('should be possible to go to the next item (activation = `manual`)', async () => {
      renderTemplate(
        html`
          <Tabs manual>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 0 })

      await press(Keys.ArrowRight)
      assertTabs({ active: 0 })
      await press(Keys.Enter)
      assertTabs({ active: 1 })

      await press(Keys.ArrowRight)
      assertTabs({ active: 1 })
      await press(Keys.Enter)
      assertTabs({ active: 2 })
    })

    it('should wrap around at the end (activation = `auto`)', async () => {
      renderTemplate(
        html`
          <Tabs>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 0 })

      await press(Keys.ArrowRight)
      assertTabs({ active: 1 })

      await press(Keys.ArrowRight)
      assertTabs({ active: 2 })

      await press(Keys.ArrowRight)
      assertTabs({ active: 0 })

      await press(Keys.ArrowRight)
      assertTabs({ active: 1 })
    })

    it('should wrap around at the end (activation = `manual`)', async () => {
      renderTemplate(
        html`
          <Tabs manual>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 0 })

      await press(Keys.ArrowRight)
      assertTabs({ active: 0 })
      await press(Keys.Enter)
      assertTabs({ active: 1 })

      await press(Keys.ArrowRight)
      assertTabs({ active: 1 })
      await press(Keys.Enter)
      assertTabs({ active: 2 })

      await press(Keys.ArrowRight)
      assertTabs({ active: 2 })
      await press(Keys.Enter)
      assertTabs({ active: 0 })

      await press(Keys.ArrowRight)
      assertTabs({ active: 0 })
      await press(Keys.Enter)
      assertTabs({ active: 1 })
    })

    it('should not be possible to go right when in vertical mode (activation = `auto`)', async () => {
      renderTemplate(
        html`
          <Tabs vertical>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 0, orientation: 'vertical' })

      await press(Keys.ArrowRight)
      // no-op
      assertTabs({ active: 0, orientation: 'vertical' })
    })

    it('should not be possible to go right when in vertical mode (activation = `manual`)', async () => {
      renderTemplate(
        html`
          <Tabs vertical manual>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 0, orientation: 'vertical' })

      await press(Keys.ArrowRight)
      assertTabs({ active: 0, orientation: 'vertical' })
      await press(Keys.Enter)
      // no-op
      assertTabs({ active: 0, orientation: 'vertical' })
    })
  })

  describe('`ArrowLeft` key', () => {
    it('should be possible to go to the previous item (activation = `auto`)', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="2">
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 2 })

      await press(Keys.ArrowLeft)
      assertTabs({ active: 1 })

      await press(Keys.ArrowLeft)
      assertTabs({ active: 0 })
    })

    it('should be possible to go to the previous item (activation = `manual`)', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="2" manual>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 2 })

      await press(Keys.ArrowLeft)
      assertTabs({ active: 2 })
      await press(Keys.Enter)
      assertTabs({ active: 1 })

      await press(Keys.ArrowLeft)
      assertTabs({ active: 1 })
      await press(Keys.Enter)
      assertTabs({ active: 0 })
    })

    it('should wrap around at the beginning (activation = `auto`)', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="2">
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 2 })

      await press(Keys.ArrowLeft)
      assertTabs({ active: 1 })

      await press(Keys.ArrowLeft)
      assertTabs({ active: 0 })

      await press(Keys.ArrowLeft)
      assertTabs({ active: 2 })

      await press(Keys.ArrowLeft)
      assertTabs({ active: 1 })
    })

    it('should wrap around at the beginning (activation = `manual`)', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="2" manual>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 2 })

      await press(Keys.ArrowLeft)
      assertTabs({ active: 2 })
      await press(Keys.Enter)
      assertTabs({ active: 1 })

      await press(Keys.ArrowLeft)
      assertTabs({ active: 1 })
      await press(Keys.Enter)
      assertTabs({ active: 0 })

      await press(Keys.ArrowLeft)
      assertTabs({ active: 0 })
      await press(Keys.Enter)
      assertTabs({ active: 2 })

      await press(Keys.ArrowLeft)
      assertTabs({ active: 2 })
      await press(Keys.Enter)
      assertTabs({ active: 1 })
    })

    it('should not be possible to go left when in vertical mode (activation = `auto`)', async () => {
      renderTemplate(
        html`
          <Tabs vertical>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 0, orientation: 'vertical' })

      await press(Keys.ArrowLeft)
      // no-op
      assertTabs({ active: 0, orientation: 'vertical' })
    })

    it('should not be possible to go left when in vertical mode (activation = `manual`)', async () => {
      renderTemplate(
        html`
          <Tabs vertical manual>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 0, orientation: 'vertical' })

      await press(Keys.ArrowLeft)
      assertTabs({ active: 0, orientation: 'vertical' })
      await press(Keys.Enter)

      // no-op
      assertTabs({ active: 0, orientation: 'vertical' })
    })
  })

  describe('`ArrowDown` key', () => {
    it('should be possible to go to the next item (activation = `auto`)', async () => {
      renderTemplate(
        html`
          <Tabs vertical>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 0, orientation: 'vertical' })

      await press(Keys.ArrowDown)
      assertTabs({ active: 1, orientation: 'vertical' })

      await press(Keys.ArrowDown)
      assertTabs({ active: 2, orientation: 'vertical' })
    })

    it('should be possible to go to the next item (activation = `manual`)', async () => {
      renderTemplate(
        html`
          <Tabs vertical manual>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 0, orientation: 'vertical' })

      await press(Keys.ArrowDown)
      assertTabs({ active: 0, orientation: 'vertical' })
      await press(Keys.Enter)
      assertTabs({ active: 1, orientation: 'vertical' })

      await press(Keys.ArrowDown)
      assertTabs({ active: 1, orientation: 'vertical' })
      await press(Keys.Enter)
      assertTabs({ active: 2, orientation: 'vertical' })
    })

    it('should wrap around at the end (activation = `auto`)', async () => {
      renderTemplate(
        html`
          <Tabs vertical>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 0, orientation: 'vertical' })

      await press(Keys.ArrowDown)
      assertTabs({ active: 1, orientation: 'vertical' })

      await press(Keys.ArrowDown)
      assertTabs({ active: 2, orientation: 'vertical' })

      await press(Keys.ArrowDown)
      assertTabs({ active: 0, orientation: 'vertical' })

      await press(Keys.ArrowDown)
      assertTabs({ active: 1, orientation: 'vertical' })
    })

    it('should wrap around at the end (activation = `manual`)', async () => {
      renderTemplate(
        html`
          <Tabs vertical manual>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 0, orientation: 'vertical' })

      await press(Keys.ArrowDown)
      assertTabs({ active: 0, orientation: 'vertical' })
      await press(Keys.Enter)
      assertTabs({ active: 1, orientation: 'vertical' })

      await press(Keys.ArrowDown)
      assertTabs({ active: 1, orientation: 'vertical' })
      await press(Keys.Enter)
      assertTabs({ active: 2, orientation: 'vertical' })

      await press(Keys.ArrowDown)
      assertTabs({ active: 2, orientation: 'vertical' })
      await press(Keys.Enter)
      assertTabs({ active: 0, orientation: 'vertical' })

      await press(Keys.ArrowDown)
      assertTabs({ active: 0, orientation: 'vertical' })
      await press(Keys.Enter)
      assertTabs({ active: 1, orientation: 'vertical' })
    })

    it('should not be possible to go down when in horizontal mode (activation = `auto`)', async () => {
      renderTemplate(
        html`
          <Tabs>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 0 })

      await press(Keys.ArrowDown)
      // no-op
      assertTabs({ active: 0 })
    })

    it('should not be possible to go down when in horizontal mode (activation = `manual`)', async () => {
      renderTemplate(
        html`
          <Tabs manual>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 0 })

      await press(Keys.ArrowDown)
      assertTabs({ active: 0 })
      await press(Keys.Enter)

      // no-op
      assertTabs({ active: 0 })
    })
  })

  describe('`ArrowUp` key', () => {
    it('should be possible to go to the previous item (activation = `auto`)', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="2" vertical>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 2, orientation: 'vertical' })

      await press(Keys.ArrowUp)
      assertTabs({ active: 1, orientation: 'vertical' })

      await press(Keys.ArrowUp)
      assertTabs({ active: 0, orientation: 'vertical' })
    })

    it('should be possible to go to the previous item (activation = `manual`)', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="2" vertical manual>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 2, orientation: 'vertical' })

      await press(Keys.ArrowUp)
      assertTabs({ active: 2, orientation: 'vertical' })
      await press(Keys.Enter)
      assertTabs({ active: 1, orientation: 'vertical' })

      await press(Keys.ArrowUp)
      assertTabs({ active: 1, orientation: 'vertical' })
      await press(Keys.Enter)
      assertTabs({ active: 0, orientation: 'vertical' })
    })

    it('should wrap around at the beginning (activation = `auto`)', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="2" vertical>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 2, orientation: 'vertical' })

      await press(Keys.ArrowUp)
      assertTabs({ active: 1, orientation: 'vertical' })

      await press(Keys.ArrowUp)
      assertTabs({ active: 0, orientation: 'vertical' })

      await press(Keys.ArrowUp)
      assertTabs({ active: 2, orientation: 'vertical' })

      await press(Keys.ArrowUp)
      assertTabs({ active: 1, orientation: 'vertical' })
    })

    it('should wrap around at the beginning (activation = `manual`)', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="2" vertical manual>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 2, orientation: 'vertical' })

      await press(Keys.ArrowUp)
      assertTabs({ active: 2, orientation: 'vertical' })
      await press(Keys.Enter)
      assertTabs({ active: 1, orientation: 'vertical' })

      await press(Keys.ArrowUp)
      assertTabs({ active: 1, orientation: 'vertical' })
      await press(Keys.Enter)
      assertTabs({ active: 0, orientation: 'vertical' })

      await press(Keys.ArrowUp)
      assertTabs({ active: 0, orientation: 'vertical' })
      await press(Keys.Enter)
      assertTabs({ active: 2, orientation: 'vertical' })

      await press(Keys.ArrowUp)
      assertTabs({ active: 2, orientation: 'vertical' })
      await press(Keys.Enter)
      assertTabs({ active: 1, orientation: 'vertical' })
    })

    it('should not be possible to go left when in vertical mode (activation = `auto`)', async () => {
      renderTemplate(
        html`
          <Tabs>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 0 })

      await press(Keys.ArrowUp)
      // no-op
      assertTabs({ active: 0 })
    })

    it('should not be possible to go left when in vertical mode (activation = `manual`)', async () => {
      renderTemplate(
        html`
          <Tabs manual>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 0 })

      await press(Keys.ArrowUp)
      assertTabs({ active: 0 })
      await press(Keys.Enter)

      // no-op
      assertTabs({ active: 0 })
    })
  })

  describe('`Home` key', () => {
    it('should be possible to go to the first focusable item (activation = `auto`)', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="1">
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 1 })

      await press(Keys.Home)
      assertTabs({ active: 0 })
    })

    it('should be possible to go to the first focusable item (activation = `manual`)', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="1" manual>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 1 })

      await press(Keys.Home)
      assertTabs({ active: 1 })
      await press(Keys.Enter)
      assertTabs({ active: 0 })
    })
  })

  describe('`PageUp` key', () => {
    it('should be possible to go to the first focusable item (activation = `auto`)', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="1">
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 1 })

      await press(Keys.PageUp)
      assertTabs({ active: 0 })
    })

    it('should be possible to go to the first focusable item (activation = `manual`)', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="1" manual>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 1 })

      await press(Keys.PageUp)
      assertTabs({ active: 1 })
      await press(Keys.Enter)
      assertTabs({ active: 0 })
    })
  })

  describe('`End` key', () => {
    it('should be possible to go to the first focusable item (activation = `auto`)', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="1">
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 1 })

      await press(Keys.End)
      assertTabs({ active: 2 })
    })

    it('should be possible to go to the first focusable item (activation = `manual`)', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="1" manual>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 1 })

      await press(Keys.End)
      assertTabs({ active: 1 })
      await press(Keys.Enter)
      assertTabs({ active: 2 })
    })
  })

  describe('`PageDown` key', () => {
    it('should be possible to go to the first focusable item (activation = `auto`)', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="1">
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 1 })

      await press(Keys.PageDown)
      assertTabs({ active: 2 })
    })

    it('should be possible to go to the first focusable item (activation = `manual`)', async () => {
      renderTemplate(
        html`
          <Tabs :defaultIndex="1" manual>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      await press(Keys.Tab)
      assertTabs({ active: 1 })

      await press(Keys.PageDown)
      assertTabs({ active: 1 })
      await press(Keys.Enter)
      assertTabs({ active: 2 })
    })
  })

  describe('`Enter` key', () => {
    it('should be possible to activate the focused tab', async () => {
      renderTemplate(
        html`
          <Tabs manual>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      getByText('Tab 3')?.focus()

      assertActiveElement(getByText('Tab 3'))
      assertTabs({ active: 0 })

      await press(Keys.Enter)
      assertTabs({ active: 2 })
    })
  })

  describe('`Space` key', () => {
    it('should be possible to activate the focused tab', async () => {
      renderTemplate(
        html`
          <Tabs manual>
            <TabsList>
              <TabsTab>Tab 1</TabsTab>
              <TabsTab>Tab 2</TabsTab>
              <TabsTab>Tab 3</TabsTab>
            </TabsList>

            <TabsPanels>
              <TabsPanel>Content 1</TabsPanel>
              <TabsPanel>Content 2</TabsPanel>
              <TabsPanel>Content 3</TabsPanel>
            </TabsPanels>
          </Tabs>

          <button>after</button>
        `
      )

      await new Promise<void>(nextTick)

      assertActiveElement(document.body)

      getByText('Tab 3')?.focus()

      assertActiveElement(getByText('Tab 3'))
      assertTabs({ active: 0 })

      await press(Keys.Space)
      assertTabs({ active: 2 })
    })
  })
})

describe('Mouse interactions', () => {
  it('should be possible to click on a tab to focus it', async () => {
    renderTemplate(
      html`
        <Tabs :defaultIndex="1">
          <TabsList>
            <TabsTab>Tab 1</TabsTab>
            <TabsTab>Tab 2</TabsTab>
            <TabsTab>Tab 3</TabsTab>
          </TabsList>

          <TabsPanels>
            <TabsPanel>Content 1</TabsPanel>
            <TabsPanel>Content 2</TabsPanel>
            <TabsPanel>Content 3</TabsPanel>
          </TabsPanels>
        </Tabs>

        <button>after</button>
      `
    )

    await new Promise<void>(nextTick)

    assertActiveElement(document.body)
    await press(Keys.Tab)
    assertTabs({ active: 1 })

    await click(getByText('Tab 1'))
    assertTabs({ active: 0 })

    await click(getByText('Tab 3'))
    assertTabs({ active: 2 })

    await click(getByText('Tab 2'))
    assertTabs({ active: 1 })
  })

  it('should be a no-op when clicking on a disabled tab', async () => {
    renderTemplate(
      html`
        <Tabs :defaultIndex="1">
          <TabsList>
            <TabsTab disabled>Tab 1</TabsTab>
            <TabsTab>Tab 2</TabsTab>
            <TabsTab>Tab 3</TabsTab>
          </TabsList>

          <TabsPanels>
            <TabsPanel>Content 1</TabsPanel>
            <TabsPanel>Content 2</TabsPanel>
            <TabsPanel>Content 3</TabsPanel>
          </TabsPanels>
        </Tabs>

        <button>after</button>
      `
    )

    await new Promise<void>(nextTick)

    assertActiveElement(document.body)
    await press(Keys.Tab)
    assertTabs({ active: 1 })

    await click(getByText('Tab 1'))
    // No-op, Tab 2 is still active
    assertTabs({ active: 1 })
  })
})

it('should trigger the `onChange` when the tab changes', async () => {
  let changes = jest.fn()

  renderTemplate({
    template: html`
      <Tabs @change="changes">
        <TabsList>
          <TabsTab>Tab 1</TabsTab>
          <TabsTab>Tab 2</TabsTab>
          <TabsTab>Tab 3</TabsTab>
        </TabsList>

        <TabsPanels>
          <TabsPanel>Content 1</TabsPanel>
          <TabsPanel>Content 2</TabsPanel>
          <TabsPanel>Content 3</TabsPanel>
        </TabsPanels>
      </Tabs>

      <button>after</button>
    `,
    setup: () => ({ changes }),
  })

  await new Promise<void>(nextTick)

  await click(getByText('Tab 2'))
  await click(getByText('Tab 3'))
  await click(getByText('Tab 2'))
  await click(getByText('Tab 1'))

  expect(changes).toHaveBeenCalledTimes(4)

  expect(changes).toHaveBeenNthCalledWith(1, 1)
  expect(changes).toHaveBeenNthCalledWith(2, 2)
  expect(changes).toHaveBeenNthCalledWith(3, 1)
  expect(changes).toHaveBeenNthCalledWith(4, 0)
})
