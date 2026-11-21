'use client'

import { useEffect } from 'react'

/**
 * Opens the collapsed section a link points at (/guide#risk from Home's "কেন এই পরামর্শ?", #listen
 * from the voice tip, the chips at the top) and scrolls to it: a closed <details> would otherwise
 * show only its title.
 */
export default function OpenOnHash() {
  useEffect(() => {
    function open() {
      const id = decodeURIComponent(window.location.hash.slice(1))
      const target = id ? document.getElementById(id) : null
      if (!(target instanceof HTMLDetailsElement)) return
      target.open = true
      target.scrollIntoView({ block: 'start' })
    }
    open()
    window.addEventListener('hashchange', open)
    return () => window.removeEventListener('hashchange', open)
  }, [])
  return null
}
