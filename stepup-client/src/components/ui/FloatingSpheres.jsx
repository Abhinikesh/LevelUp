import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function FloatingSpheres() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // Scene
    const scene = new THREE.Scene()

    // Camera
    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    )
    camera.position.z = 10

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(container.clientWidth, container.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    container.appendChild(renderer.domElement)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambientLight)

    const pointLight1 = new THREE.PointLight(0x6C63FF, 2, 30)
    pointLight1.position.set(5, 5, 5)
    scene.add(pointLight1)

    const pointLight2 = new THREE.PointLight(0xFF6584, 2, 30)
    pointLight2.position.set(-5, -5, 5)
    scene.add(pointLight2)

    // Spheres geometry & material
    const geometry = new THREE.SphereGeometry(1.2, 32, 32)
    const materials = [
      new THREE.MeshStandardMaterial({
        color: 0x6C63FF,
        roughness: 0.1,
        metalness: 0.1,
        emissive: 0x6C63FF,
        emissiveIntensity: 0.3
      }),
      new THREE.MeshStandardMaterial({
        color: 0xFF6584,
        roughness: 0.1,
        metalness: 0.1,
        emissive: 0xFF6584,
        emissiveIntensity: 0.3
      })
    ]

    // Create 6 spheres
    const spheres = []
    for (let i = 0; i < 6; i++) {
      const material = materials[i % 2]
      const mesh = new THREE.Mesh(geometry, material)
      
      // Random coordinates in space
      mesh.position.x = (Math.random() - 0.5) * 12
      mesh.position.y = (Math.random() - 0.5) * 8
      mesh.position.z = (Math.random() - 0.5) * 4 - 2

      // Custom velocity and speed multipliers for animations
      mesh.userData = {
        floatSpeed: 0.002 + Math.random() * 0.003,
        floatRange: 0.5 + Math.random() * 0.8,
        floatOffset: Math.random() * Math.PI * 2,
        rotSpeedX: (Math.random() - 0.5) * 0.01,
        rotSpeedY: (Math.random() - 0.5) * 0.01,
        initialY: mesh.position.y
      }

      scene.add(mesh)
      spheres.push(mesh)
    }

    // Animation Loop
    let clock = new THREE.Clock()
    let animationFrameId

    const animate = () => {
      const elapsedTime = clock.getElapsedTime()

      spheres.forEach((sphere) => {
        const u = sphere.userData
        // Float up and down
        sphere.position.y = u.initialY + Math.sin(elapsedTime * u.floatSpeed * 100 + u.floatOffset) * u.floatRange
        // Rotate
        sphere.rotation.x += u.rotSpeedX
        sphere.rotation.y += u.rotSpeedY
      })

      renderer.render(scene, camera)
      animationFrameId = requestAnimationFrame(animate)
    }
    animate()

    // Handle Resize
    const handleResize = () => {
      if (!container) return
      camera.aspect = container.clientWidth / container.clientHeight
      camera.updateProjectionMatrix()
      renderer.setSize(container.clientWidth, container.clientHeight)
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', handleResize)
      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement)
      }
      geometry.dispose()
      materials.forEach(m => m.dispose())
      renderer.dispose()
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0 filter blur-[40px] opacity-45"
      style={{ mixBlendMode: 'screen' }}
    />
  )
}
