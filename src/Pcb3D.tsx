import type * as React from "react"
import type { AnySoupElement } from "@tscircuit/soup"
import { useMemo } from "react"
import { su, type SoupUtilObjects } from "@tscircuit/soup-util"
import { useStlsFromGeom } from "./hooks/use-stls-from-geom"
import { createBoardGeomFromSoup } from "./soup-to-3d"
import { useConvertChildrenToSoup } from "./hooks/use-convert-children-to-soup"
import { STLModel } from "./three-components/STLModel"
import { ThreeErrorBoundary } from "./three-components/ThreeErrorBoundary"
import { AnyCadComponent, type tooltip } from "./AnyCadComponent"
import { Error3d } from "./three-components/Error3d"

export interface RaycastEvent extends tooltip.RaycastEvent {
  source_component: SoupUtilObjects["source_component"]
  cad_component: ReturnType<SoupUtilObjects["cad_component"]["list"]>[0]
}

export interface HoverProps
  extends Omit<tooltip.HoverProps<RaycastEvent>, "isHovered"> {
  hoverAt?: RaycastEvent["cad_component"]["cad_component_id"]
}

export function Pcb3D({
  soup,
  children,
  onHover,
  onUnhover,
  hoverAt,
}: React.PropsWithChildren<HoverProps & { soup?: AnySoupElement[] }>) {
  soup ??= useConvertChildrenToSoup(children, soup) as any

  if (!soup) return null

  const boardGeom = useMemo(() => {
    if (!soup.some((e) => e.type === "pcb_board")) return null
    return createBoardGeomFromSoup(soup)
  }, [soup])

  const { stls: boardStls } = useStlsFromGeom(boardGeom)

  const soupUtil = su(soup)
  const cad_components = soupUtil.cad_component.list()

  return [
    ...boardStls.map(({ stlUrl, color }, index) => (
      <STLModel
        key={stlUrl}
        stlUrl={stlUrl}
        color={color}
        opacity={index === 0 ? 0.95 : 1}
      />
    )),
    ...cad_components.map((cad_component) => (
      <ThreeErrorBoundary
        key={cad_component.cad_component_id}
        fallback={({ error }) => (
          <Error3d cad_component={cad_component} error={error} />
        )}
      >
        <AnyCadComponent
          key={cad_component.cad_component_id}
          onHover={
            onHover &&
            ((e) =>
              onHover({
                source_component: soupUtil.source_component,
                cad_component,
                ...e,
              }))
          }
          onUnhover={
            onUnhover &&
            ((e) =>
              onUnhover({
                source_component: soupUtil.source_component,
                cad_component,
                ...e,
              }))
          }
          cad_component={cad_component}
          isHovered={hoverAt === cad_component.cad_component_id}
        />
      </ThreeErrorBoundary>
    )),
  ]
}
