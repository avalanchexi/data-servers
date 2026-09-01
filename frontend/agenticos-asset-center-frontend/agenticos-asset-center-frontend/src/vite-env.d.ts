/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'react-cytoscapejs' {
  import type { FC } from 'react'
  import type { Core, CytoscapeOptions } from 'cytoscape'

  interface CytoscapeComponentProps {
    elements: CytoscapeOptions['elements']
    stylesheet?: CytoscapeOptions['style']
    layout?: CytoscapeOptions['layout']
    style?: React.CSSProperties
    cy?: (cy: Core) => void
    className?: string
    wheelSensitivity?: number
    minZoom?: number
    maxZoom?: number
    autoungrabify?: boolean
    autounselectify?: boolean
    panningEnabled?: boolean
    userZoomingEnabled?: boolean
    boxSelectionEnabled?: boolean
  }

  const CytoscapeComponent: FC<CytoscapeComponentProps>
  export default CytoscapeComponent
}

declare module 'cytoscape-cose-bilkent' {
  import type { Ext } from 'cytoscape'
  const coseBilkent: Ext
  export default coseBilkent
}

declare module 'plotly.js-dist-min' {
  interface PlotlyConfig {
    responsive?: boolean
    displayModeBar?: boolean
    modeBarButtonsToRemove?: string[]
    displaylogo?: boolean
    toImageButtonOptions?: {
      format?: string
      filename?: string
      scale?: number
    }
  }

  interface PlotlyStatic {
    newPlot(el: HTMLElement, data: unknown[], layout: Record<string, unknown>, config?: PlotlyConfig): Promise<void>
    purge(el: HTMLElement): void
    downloadImage(el: HTMLElement, opts: Record<string, unknown>): Promise<void>
    toImage(el: HTMLElement, opts: Record<string, unknown>): Promise<string>
  }

  const Plotly: PlotlyStatic
  export default Plotly
}
