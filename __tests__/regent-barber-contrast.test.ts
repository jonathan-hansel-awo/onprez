import fs from 'fs'
import path from 'path'

describe('Regent Barber colour contrast', () => {
  it('renders pale experience copy on the charcoal surface', () => {
    const stylesheetPath = path.join(process.cwd(), 'src', 'app', 'legal.css')
    const layoutPath = path.join(process.cwd(), 'src', 'app', 'layout.tsx')
    const stylesheet = fs.readFileSync(stylesheetPath, 'utf8')
    const layout = fs.readFileSync(layoutPath, 'utf8')

    expect(layout).toContain("import './legal.css'")
    expect(stylesheet).toContain(
      "[data-presence-template='regent-barber'] section[id*='-about-']"
    )
    expect(stylesheet).toContain('background-color: #191916 !important;')
    expect(stylesheet).toContain('color: #f5f0e8 !important;')
  })
})
