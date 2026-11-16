export function isElectron() {
  return window.location.protocol === 'monitor:' ||
    (import.meta.env.DEV && new URLSearchParams(window.location.search).get('electron') === '1')
}
