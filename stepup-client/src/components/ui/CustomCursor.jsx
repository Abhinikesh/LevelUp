import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const dotRef  = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    const dot  = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    let mouseX = 0, mouseY = 0
    let ringX  = 0, ringY  = 0
    let rafId  = null

    const onMouseMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`
    }

    // Smooth ring with lerp
    const lerp = (a, b, t) => a + (b - a) * t
    const animate = () => {
      ringX = lerp(ringX, mouseX, 0.12)
      ringY = lerp(ringY, mouseY, 0.12)
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`
      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)

    // Hover detection — scale up ring on interactive elements
    const addHover = () => ring.classList.add('hovering')
    const removeHover = () => ring.classList.remove('hovering')
    const addClick = () => ring.classList.add('clicking')
    const removeClick = () => ring.classList.remove('clicking')

    const interactives = document.querySelectorAll(
      'a, button, input, textarea, select, label, [role="button"], [data-cursor="pointer"]'
    )
    interactives.forEach((el) => {
      el.addEventListener('mouseenter', addHover)
      el.addEventListener('mouseleave', removeHover)
    })

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', addClick)
    window.addEventListener('mouseup',   removeClick)

    // Re-attach on DOM changes (for dynamic elements)
    const observer = new MutationObserver(() => {
      document.querySelectorAll(
        'a, button, input, textarea, select, label, [role="button"], [data-cursor="pointer"]'
      ).forEach((el) => {
        el.removeEventListener('mouseenter', addHover)
        el.removeEventListener('mouseleave', removeHover)
        el.addEventListener('mouseenter', addHover)
        el.addEventListener('mouseleave', removeHover)
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', addClick)
      window.removeEventListener('mouseup',   removeClick)
      cancelAnimationFrame(rafId)
      observer.disconnect()
    }
  }, [])

  return (
    <>
      <div ref={dotRef}  className="cursor-dot"  aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  )
}
