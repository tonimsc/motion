import * as React from "react"
import { motion, AnimateSharedLayout, AnimatePresence } from "@framer"

interface ContextProps {
    isCurrent: boolean
    layoutOrder: number
    isValidMagicMotionTarget: boolean
    areMagicMotionLayersPresent: false | undefined
}

const ContainerContext = React.createContext<ContextProps>({
    isCurrent: true,
    layoutOrder: 0,
    isValidMagicMotionTarget: true,
    areMagicMotionLayersPresent: undefined,
})

interface NavigationState {
    containers: Record<string, React.ReactNode>
    containerIndex: Record<string, number>
    containerVisualIndex: Record<string, number>
    containerIsRemoved: Record<string, boolean>
    containerCanProvideBoundingBoxes: Record<string, boolean>
    current: number
    previous: number
    dependency: string
}

const Navigation = (props: NavigationState) => {
    return (
        <>
            {Object.keys(props.containers).map(key => {
                const children = props.containers[key]
                const index = props.containerIndex[key]
                const visualIndex = props.containerVisualIndex[key]
                const removed = props.containerIsRemoved[key]
                const isCurrent = index === props.current
                const isPrevious = index === props.previous
                const areMagicMotionLayersPresent = isCurrent ? false : removed
                const canProvideBoundingBoxes =
                    props.containerCanProvideBoundingBoxes[key]
                const isPresent: false | undefined = areMagicMotionLayersPresent
                    ? false
                    : undefined

                const containerProps = {
                    children: React.Children.map(
                        children,
                        (child: React.ReactElement) =>
                            React.cloneElement(child, undefined)
                    ),
                    value: {
                        isCurrent,
                        layoutOrder: visualIndex,
                        isValidMagicMotionTarget: canProvideBoundingBoxes,
                        areMagicMotionLayersPresent: isPresent,
                    },
                }

                const style: React.CSSProperties = {
                    visibility: isCurrent || isPrevious ? "visible" : "hidden",
                    zIndex: visualIndex,
                    pointerEvents: isPresent === false ? "none" : "initial",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                }

                return (
                    <motion.div style={style} key={key}>
                        <ContainerContext.Provider {...containerProps} />
                    </motion.div>
                )
            })}
        </>
    )
}

// Demo assumes that layoutId is static, and that all layers on each screen should animate.
// In reality, layoutId and _shouldAnimate are generated by calls to a context.
const Layer = props => {
    const {
        isCurrent,
        layoutOrder,
        isValidMagicMotionTarget,
        areMagicMotionLayersPresent,
    } = React.useContext(ContainerContext)

    const magicProps = isValidMagicMotionTarget
        ? {
              layoutId: props.layoutId,
              _shouldAnimate: true,
              layoutOrder,
          }
        : { layoutId: undefined }

    if (areMagicMotionLayersPresent === false) {
        magicProps.isPresent = false
    }

    return (
        <motion.div
            key={props.id}
            {...props}
            {...magicProps}
            data-layoutid={magicProps.layoutId}
            data-shouldanimate={isCurrent}
            data-order={layoutOrder}
            data-ispresent={areMagicMotionLayersPresent}
        />
    )
}

const containerStyle: React.CSSProperties = {
    width: 200,
    height: 500,
    backgroundColor: "white",
    position: "absolute",
    opacity: 1,
}

const cardStyle: React.CSSProperties = {
    pointerEvents: "auto",
    position: "absolute",
    top: 20,
    left: 50,
    width: 100,
    height: 100,
    background: "blue",
    opacity: 1,
}

const a = () => (
    <Layer id={"1"} layoutId="container" style={containerStyle}>
        <Layer id={"2"} layoutId="card" style={{ ...cardStyle }} />
    </Layer>
)

const b = () => (
    <Layer id={"3"} layoutId="container" style={containerStyle}>
        <Layer
            id={"4"}
            layoutId="card"
            style={{ ...cardStyle, top: 200, background: "red" }}
        />
    </Layer>
)

const A = React.createElement(a)
const B = React.createElement(b)

export const App = () => {
    const lastScreenRef = React.useRef("a")
    const [navigationState, setNavigationState] = React.useState<
        NavigationState
    >({
        containers: { a: A },
        containerIndex: { a: 0 },
        containerVisualIndex: { a: 0 },
        containerIsRemoved: { a: false },
        containerCanProvideBoundingBoxes: { a: true },
        current: 0,
        previous: -1,
        dependency: performance.now().toString(),
    })

    const nextPage = React.useCallback(() => {
        const {
            current,
            containers,
            containerIndex,
            containerVisualIndex,
            containerIsRemoved,
            containerCanProvideBoundingBoxes,
            dependency,
        } = navigationState
        if (
            lastScreenRef.current === "a" &&
            navigationState.containers["b"] === undefined
        ) {
            const newState = {
                current: current + 1,
                previous: current,
                containers: {
                    ...containers,
                    b: B,
                },
                containerIndex: {
                    ...containerIndex,
                    b: 1,
                },
                containerVisualIndex: {
                    ...containerVisualIndex,
                    b: 1,
                },
                containerIsRemoved: {
                    ...containerIsRemoved,
                    b: false,
                },
                containerCanProvideBoundingBoxes: {
                    ...containerCanProvideBoundingBoxes,
                    b: true,
                },
                // Dependency not updated to add new screen as "Instant"
                dependency,
            }
            lastScreenRef.current = "b"
            setNavigationState(newState)
        } else if (lastScreenRef.current === "a") {
            const newState = {
                current: current + 1,
                previous: current,
                containers: {
                    ...containers,
                },
                containerIndex: {
                    ...containerIndex,
                    b: current + 1,
                },
                containerVisualIndex: {
                    ...containerVisualIndex,
                    b: current + 1,
                },
                containerIsRemoved: {
                    ...containerIsRemoved,
                    b: false,
                },
                containerCanProvideBoundingBoxes: {
                    ...containerCanProvideBoundingBoxes,
                    b: true,
                },
                dependency,
            }
            lastScreenRef.current = "b"
            setNavigationState(newState)
        } else {
            const newState = {
                current: current + 1,
                previous: current,
                containers: {
                    ...containers,
                },
                containerIndex: {
                    ...containerIndex,
                    a: current + 1,
                },
                containerVisualIndex: {
                    ...containerVisualIndex,
                },
                containerIsRemoved: {
                    ...containerIsRemoved,
                    b: true,
                },
                containerCanProvideBoundingBoxes: {
                    ...containerCanProvideBoundingBoxes,
                    b: true,
                },
                // Dependency updated to transition to A with magic motion
                dependency: performance.now().toString(),
            }
            setNavigationState(newState)
            lastScreenRef.current = "a"
        }
    }, [navigationState])

    return (
        <AnimateSharedLayout
            type="crossfade"
            supportRotate
            transition={{ duration: 2 }}
            dependency={navigationState.dependency}
        >
            <AnimatePresence>
                <motion.div
                    onClick={nextPage}
                    style={{
                        position: "relative",
                    }}
                >
                    <Navigation {...navigationState} />
                </motion.div>
            </AnimatePresence>
        </AnimateSharedLayout>
    )
}
