// Fond décoratif : trame de cases façon tableau périodique. Couleur et opacité via .chart-bg
// (moteur) et app.css.
export function PeriodicBackground() {
  return (
    <div className="chart-bg" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
        <defs>
          <pattern id="pt-grid" width="64" height="64" patternUnits="userSpaceOnUse">
            <rect x="6" y="6" width="52" height="52" rx="6" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pt-grid)" />
      </svg>
    </div>
  )
}
