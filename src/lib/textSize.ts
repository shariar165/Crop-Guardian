// «লেখার আকার» in /settings. Every font size is in rem and spacing is in px (globals.css), so
// raising the root font size grows the text and leaves the layout alone.
// No client imports: the root layout (a server component) reads TEXT_SIZE_SCRIPT from here.

export type TextSize = 'normal' | 'large'
export const TEXT_SIZE_KEY = 'crop-guardian:text-size'

export const textSizeOf = (stored: string | null): TextSize => (stored === 'large' ? 'large' : 'normal')

// Runs in <head> before the first paint, so a large-text phone never flashes small text.
export const TEXT_SIZE_SCRIPT = `try{if(localStorage.getItem('${TEXT_SIZE_KEY}')==='large')document.documentElement.dataset.text='large'}catch(e){}`
