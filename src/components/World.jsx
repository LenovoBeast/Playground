import { useEffect, useRef } from 'react'
import { setupScene, buildWorld, clickObjects } from '../world.js'
import { wireGames } from '../games/wireGames.js'

// World.jsx — the Three.js backdrop that renders inside the React app.
//
// Previously the world lived in `src/main.js`, which index.html never loaded,
// so the entire 3D scene (floating desk, particles, game artifacts) and all
// five mini-games were dead code. This component mounts the world on the
// canvas and wires the lazy game loader, pausing the world while a game
// overlay is open.

export default function World() {
  const canvasRef = useRef(null)
  const worldRef = useRef(null)
  const runningRef = useRef(true)

  useEffect(() => {
    const canvas = canvasRef.current
    const { scene, camera, renderer, controls, update, dispose } = setupScene(canvas)
    const world = buildWorld(scene)
    worldRef.current = { scene, camera, renderer, controls, update, world, dispose }

    const pause = () => { runningRef.current = false }
    const resume = () => {
      runningRef.current = true
      requestAnimationFrame(tick)
    }
    const { dispose: disposeGames } = wireGames({ renderer, camera, pause, resume, clickObjects })

    let raf = 0
    const tick = (t) => {
      if (!runningRef.current) return
      const time = t * 0.001
      world.tick(time)
      controls.update()
      update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      disposeGames()
      dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      id="canvas"
      className="fixed inset-0 w-full h-full"
      style={{ background: '#0a080c' }}
      aria-hidden="true"
    />
  )
}