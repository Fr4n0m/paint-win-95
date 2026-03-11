const MODES = Object.freeze({
  DRAW: 'draw',
  BRUSH: 'brush',
  ERASE: 'erase',
  LINE: 'line',
  CURVE: 'curve',
  POLYGON: 'polygon',
  RECTANGLE: 'rectangle',
  ROUNDED_RECTANGLE: 'roundedRectangle',
  ELLIPSE: 'ellipse',
  FILL: 'fill',
  PICKER: 'picker',
  SELECT_FREE: 'selectFree',
  SELECT_RECT: 'selectRect',
  TEXT: 'text'
})

const TOOL_CONFIG = Object.freeze({
  [MODES.DRAW]: { buttonId: 'draw-btn', cursor: 'url("/cursors/pincel.png") 0 20, crosshair', composite: 'source-over' },
  [MODES.BRUSH]: { buttonId: 'brush-btn', cursor: 'url("/cursors/pincel.png") 0 20, crosshair', composite: 'source-over' },
  [MODES.ERASE]: { buttonId: 'erase-btn', cursor: 'url("/cursors/erase.png") 0 20, auto', composite: 'destination-out' },
  [MODES.LINE]: { buttonId: 'line-btn', cursor: 'crosshair', composite: 'source-over' },
  [MODES.CURVE]: { buttonId: 'curve-btn', cursor: 'crosshair', composite: 'source-over' },
  [MODES.POLYGON]: { buttonId: 'polygon-btn', cursor: 'crosshair', composite: 'source-over' },
  [MODES.RECTANGLE]: { buttonId: 'rectangle-btn', cursor: 'nwse-resize', composite: 'source-over' },
  [MODES.ROUNDED_RECTANGLE]: { buttonId: 'rounded-rect-btn', cursor: 'nwse-resize', composite: 'source-over' },
  [MODES.ELLIPSE]: { buttonId: 'ellipse-btn', cursor: 'crosshair', composite: 'source-over' },
  [MODES.FILL]: { buttonId: 'fill-btn', cursor: 'url("/cursors/point.png") 0 16, pointer', composite: 'source-over' },
  [MODES.PICKER]: { buttonId: 'picker-btn', cursor: 'url("/cursors/picker.png") 0 20, pointer', composite: 'source-over' },
  [MODES.SELECT_FREE]: { buttonId: 'select-btn', cursor: 'crosshair', composite: 'source-over' },
  [MODES.SELECT_RECT]: { buttonId: 'select-rect-btn', cursor: 'crosshair', composite: 'source-over' },
  [MODES.TEXT]: { buttonId: 'text-btn', cursor: 'text', composite: 'source-over' }
})

const CLASSIC_PALETTE = [
  '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
  '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff',
  '#ffa500', '#a52a2a', '#f5deb3', '#d2b48c', '#7fffd4', '#98fb98', '#add8e6', '#ffc0cb',
  '#404040', '#808040', '#004040', '#404080'
]

const SHAPE_MODES = new Set([
  MODES.LINE,
  MODES.CURVE,
  MODES.POLYGON,
  MODES.RECTANGLE,
  MODES.ROUNDED_RECTANGLE,
  MODES.ELLIPSE
])

class PaintApp {
  constructor() {
    this.paintWindow = this.getRequiredElement('paint-window')
    this.titleBar = this.getRequiredElement('title-bar')
    this.startMenu = this.getRequiredElement('start-menu')
    this.startButton = this.getRequiredElement('start-btn')
    this.taskPaintButton = this.getRequiredElement('task-paint-btn')
    this.clock = this.getRequiredElement('clock')

    this.windowMinButton = this.getRequiredElement('win-min-btn')
    this.windowMaxButton = this.getRequiredElement('win-max-btn')
    this.windowCloseButton = this.getRequiredElement('win-close-btn')

    this.desktopDocs = this.getRequiredElement('desktop-docs')
    this.desktopTrash = this.getRequiredElement('desktop-trash')

    this.menuFileBtn = this.getRequiredElement('menu-file-btn')
    this.menuEditBtn = this.getRequiredElement('menu-edit-btn')
    this.menuColoursBtn = this.getRequiredElement('menu-colours-btn')
    this.menuHelpBtn = this.getRequiredElement('menu-help-btn')

    this.canvas = this.getRequiredElement('canvas')
    this.overlayCanvas = this.getRequiredElement('overlay-canvas')
    this.canvasWrap = this.getRequiredElement('canvas-wrap')

    this.colorPicker = this.getRequiredElement('color-picker')
    this.secondaryColorPicker = this.getRequiredElement('secondary-color-picker')
    this.lineWidthInput = this.getRequiredElement('line-width')
    this.lineWidthValue = this.getRequiredElement('line-width-value')
    this.fillShapesCheckbox = this.getRequiredElement('fill-shapes')
    this.zoomSelect = this.getRequiredElement('zoom-select')
    this.primaryColorWell = this.getRequiredElement('primary-color-well')
    this.secondaryColorWell = this.getRequiredElement('secondary-color-well')
    this.palette = this.getRequiredElement('palette')
    this.statusTool = this.getRequiredElement('status-tool')
    this.statusCoords = this.getRequiredElement('status-coords')

    this.newButton = this.getRequiredElement('new-btn')
    this.openButton = this.getRequiredElement('open-btn')
    this.openFileInput = this.getRequiredElement('open-file-input')
    this.undoButton = this.getRequiredElement('undo-btn')
    this.redoButton = this.getRequiredElement('redo-btn')
    this.saveButton = this.getRequiredElement('save-btn')
    this.clearButton = this.getRequiredElement('clear-btn')
    this.pickerButton = this.getRequiredElement('picker-btn')

    this.ctx = this.canvas.getContext('2d')
    this.overlayCtx = this.overlayCanvas.getContext('2d')
    if (!this.ctx || !this.overlayCtx) {
      throw new Error('Could not initialize canvas context.')
    }

    this.mode = MODES.DRAW
    this.previousNonPickerMode = MODES.DRAW
    this.zoom = 1
    this.isDrawing = false
    this.isShiftPressed = false
    this.lastPoint = { x: 0, y: 0 }
    this.startPoint = { x: 0, y: 0 }
    this.snapshot = null
    this.resizeObserver = null
    this.clockTimer = null
    this.isWindowVisible = true
    this.isWindowMaximized = false
    this.dragWindowState = null
    this.activeDesktopIcon = null

    this.primaryColor = this.colorPicker.value
    this.secondaryColor = this.secondaryColorPicker.value
    this.activeColor = this.primaryColor
    this.lineWidth = Number(this.lineWidthInput.value)

    this.selection = null
    this.isSelecting = false
    this.isMovingSelection = false
    this.selectionStart = { x: 0, y: 0 }
    this.selectionMoveOffset = { x: 0, y: 0 }
    this.freeSelectionPath = []

    this.history = []
    this.historyIndex = -1
    this.maxHistoryEntries = 40

    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
    this.ctx.strokeStyle = this.primaryColor
    this.ctx.fillStyle = this.primaryColor
  }

  init() {
    this.bindUI()
    this.buildPalette()
    this.setupDesktopShell()
    this.setupResponsiveCanvas()
    this.setMode(MODES.DRAW)
    this.setupEyeDropperAvailability()
    this.updateColorWells()
    this.startClock()
    this.pushHistory()
    this.updateStatusTool()
    this.closeStartMenu()
  }

  bindUI() {
    this.canvas.addEventListener('contextmenu', (event) => event.preventDefault())

    this.canvas.addEventListener('pointerdown', this.onPointerDown.bind(this))
    this.canvas.addEventListener('pointermove', this.onPointerMove.bind(this))
    this.canvas.addEventListener('pointerup', this.onPointerUp.bind(this))
    this.canvas.addEventListener('pointerleave', this.onPointerUp.bind(this))
    this.canvas.addEventListener('pointercancel', this.onPointerUp.bind(this))

    this.colorPicker.addEventListener('change', () => {
      this.primaryColor = this.colorPicker.value
      this.applyActiveColor(this.primaryColor)
      this.updateColorWells()
    })

    this.secondaryColorPicker.addEventListener('change', () => {
      this.secondaryColor = this.secondaryColorPicker.value
      this.updateColorWells()
    })

    this.lineWidthInput.addEventListener('input', () => {
      this.lineWidth = Number(this.lineWidthInput.value)
      this.lineWidthValue.textContent = String(this.lineWidth)
      this.setMode(this.mode)
    })

    this.zoomSelect.addEventListener('change', () => {
      const nextZoom = Number(this.zoomSelect.value)
      this.applyZoom(nextZoom)
    })

    this.clearButton.addEventListener('click', () => {
      this.clearCanvasWithHistory()
    })

    this.saveButton.addEventListener('click', () => this.downloadCanvasAsPng())
    this.pickerButton.addEventListener('click', () => this.setMode(MODES.PICKER))
    this.pickerButton.addEventListener('dblclick', () => this.openColorPickerFromScreen())
    this.newButton.addEventListener('click', () => this.createNewCanvas())
    this.openButton.addEventListener('click', () => this.openFileInput.click())
    this.undoButton.addEventListener('click', () => this.undo())
    this.redoButton.addEventListener('click', () => this.redo())

    this.primaryColorWell.addEventListener('click', () => this.colorPicker.click())
    this.secondaryColorWell.addEventListener('click', () => this.secondaryColorPicker.click())

    this.menuFileBtn.addEventListener('click', () => this.openFileInput.click())
    this.menuEditBtn.addEventListener('click', () => this.undo())
    this.menuColoursBtn.addEventListener('click', () => this.colorPicker.click())
    this.menuHelpBtn.addEventListener('click', () => {
      window.alert('Paint Win 95\\nShortcuts: B/E/L/R/C/F/T/S and Ctrl+Z/Ctrl+Y.')
    })

    this.openFileInput.addEventListener('change', (event) => {
      const file = event.target.files?.[0]
      if (file) this.openImageFile(file)
      this.openFileInput.value = ''
    })

    Object.entries(TOOL_CONFIG).forEach(([mode, config]) => {
      const button = this.getRequiredElement(config.buttonId)
      button.addEventListener('click', () => this.setMode(mode))
    })

    document.addEventListener('keydown', (event) => {
      const { key, ctrlKey, metaKey, shiftKey } = event
      const hasCmd = ctrlKey || metaKey
      const normalized = key.toLowerCase()

      if (hasCmd) {
        if (normalized === 'z' && !shiftKey) {
          event.preventDefault()
          this.undo()
          return
        }
        if (normalized === 'y' || (normalized === 'z' && shiftKey)) {
          event.preventDefault()
          this.redo()
          return
        }
        if (normalized === 's') {
          event.preventDefault()
          this.downloadCanvasAsPng()
          return
        }
        if (normalized === 'o') {
          event.preventDefault()
          this.openFileInput.click()
          return
        }
      }

      if (normalized === 'shift') this.isShiftPressed = true
      if (normalized === 'b') this.setMode(MODES.BRUSH)
      if (normalized === 'x') this.swapColors()
      if (normalized === 'e') this.setMode(MODES.ERASE)
      if (normalized === 'l') this.setMode(MODES.LINE)
      if (normalized === 'r') this.setMode(MODES.RECTANGLE)
      if (normalized === 'c') this.setMode(MODES.ELLIPSE)
      if (normalized === 'f') this.setMode(MODES.FILL)
      if (normalized === 't') this.setMode(MODES.TEXT)
      if (normalized === 's' && !hasCmd) this.setMode(MODES.SELECT_RECT)
    })

    document.addEventListener('keyup', (event) => {
      if (event.key === 'Shift') this.isShiftPressed = false
    })
  }

  buildPalette() {
    this.palette.innerHTML = ''
    this.palette.addEventListener('contextmenu', (event) => event.preventDefault())

    CLASSIC_PALETTE.forEach((hex) => {
      const swatch = document.createElement('button')
      swatch.type = 'button'
      swatch.className = 'palette-swatch'
      swatch.style.backgroundColor = hex
      swatch.title = hex

      swatch.addEventListener('click', () => {
        this.primaryColor = hex
        this.colorPicker.value = hex
        this.applyActiveColor(hex)
        this.updateColorWells()
      })

      swatch.addEventListener('contextmenu', (event) => {
        event.preventDefault()
        this.secondaryColor = hex
        this.secondaryColorPicker.value = hex
        this.updateColorWells()
      })

      this.palette.appendChild(swatch)
    })
  }

  setupDesktopShell() {
    const desktopIcons = Array.from(document.querySelectorAll('.desktop-icon'))

    desktopIcons.forEach((icon) => {
      icon.addEventListener('click', (event) => {
        if (icon instanceof HTMLAnchorElement) {
          event.preventDefault()
        }
        this.setActiveDesktopIcon(icon)
      })
    })

    this.startButton.addEventListener('click', () => this.toggleStartMenu())

    this.taskPaintButton.addEventListener('click', () => {
      if (this.isWindowVisible) {
        this.minimizeWindow()
      } else {
        this.showWindow()
      }
      this.closeStartMenu()
    })

    this.windowMinButton.addEventListener('click', () => this.minimizeWindow())
    this.windowMaxButton.addEventListener('click', () => this.toggleMaximizeWindow())
    this.windowCloseButton.addEventListener('click', () => this.closeWindow())

    this.desktopDocs.addEventListener('dblclick', () => this.openFileInput.click())
    this.desktopTrash.addEventListener('dblclick', () => this.createNewCanvas())

    desktopIcons
      .filter((icon) => icon instanceof HTMLAnchorElement)
      .forEach((icon) => {
        icon.addEventListener('dblclick', (event) => {
          event.preventDefault()
          const href = icon.getAttribute('href')
          if (!href) return
          window.open(href, '_blank', 'noopener,noreferrer')
        })
      })

    this.getRequiredElement('start-open-paint').addEventListener('click', () => {
      this.showWindow()
      this.closeStartMenu()
    })
    this.getRequiredElement('start-new-drawing').addEventListener('click', () => {
      this.createNewCanvas()
      this.closeStartMenu()
    })
    this.getRequiredElement('start-open-image').addEventListener('click', () => {
      this.openFileInput.click()
      this.closeStartMenu()
    })
    this.getRequiredElement('start-clear-canvas').addEventListener('click', () => {
      this.clearCanvasWithHistory()
      this.closeStartMenu()
    })

    document.addEventListener('click', (event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (!target.closest('.desktop-icon')) {
        this.setActiveDesktopIcon(null)
      }
      if (!target.closest('#start-menu') && !target.closest('#start-btn')) {
        this.closeStartMenu()
      }
    })

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        this.closeStartMenu()
      }
    })

    this.titleBar.addEventListener('pointerdown', (event) => {
      if (event.target instanceof Element && event.target.closest('.title-bar-controls')) return
      if (this.isWindowMaximized) return
      this.dragWindowState = {
        pointerId: event.pointerId,
        originX: event.clientX,
        originY: event.clientY,
        startLeft: this.paintWindow.offsetLeft,
        startTop: this.paintWindow.offsetTop
      }
      this.titleBar.setPointerCapture(event.pointerId)
      this.paintWindow.style.position = 'fixed'
      this.paintWindow.style.margin = '0'
      this.paintWindow.style.left = `${this.dragWindowState.startLeft}px`
      this.paintWindow.style.top = `${this.dragWindowState.startTop}px`
    })

    this.titleBar.addEventListener('pointermove', (event) => {
      if (!this.dragWindowState || this.dragWindowState.pointerId !== event.pointerId) return
      const deltaX = event.clientX - this.dragWindowState.originX
      const deltaY = event.clientY - this.dragWindowState.originY
      const nextLeft = this.dragWindowState.startLeft + deltaX
      const nextTop = this.dragWindowState.startTop + deltaY
      this.paintWindow.style.left = `${Math.max(0, nextLeft)}px`
      this.paintWindow.style.top = `${Math.max(0, nextTop)}px`
    })

    this.titleBar.addEventListener('pointerup', (event) => {
      if (!this.dragWindowState || this.dragWindowState.pointerId !== event.pointerId) return
      if (this.titleBar.hasPointerCapture(event.pointerId)) {
        this.titleBar.releasePointerCapture(event.pointerId)
      }
      this.dragWindowState = null
    })
  }

  setActiveDesktopIcon(icon) {
    if (this.activeDesktopIcon) {
      this.activeDesktopIcon.classList.remove('active')
    }

    this.activeDesktopIcon = icon
    if (this.activeDesktopIcon) {
      this.activeDesktopIcon.classList.add('active')
    }
  }

  openStartMenu() {
    this.startMenu.hidden = false
    this.startButton.classList.add('active')
    this.startButton.setAttribute('aria-expanded', 'true')
  }

  closeStartMenu() {
    this.startMenu.hidden = true
    this.startButton.classList.remove('active')
    this.startButton.setAttribute('aria-expanded', 'false')
  }

  toggleStartMenu() {
    if (this.startMenu.hidden) {
      this.openStartMenu()
      return
    }
    this.closeStartMenu()
  }

  startClock() {
    this.updateClock()
    this.clockTimer = window.setInterval(() => this.updateClock(), 1000)
  }

  updateClock() {
    const now = new Date()
    const hours = now.getHours().toString().padStart(2, '0')
    const minutes = now.getMinutes().toString().padStart(2, '0')
    this.clock.textContent = `${hours}:${minutes}`
  }

  minimizeWindow() {
    this.isWindowVisible = false
    this.paintWindow.classList.add('hidden')
    this.taskPaintButton.classList.remove('active')
    this.closeStartMenu()
  }

  showWindow() {
    this.isWindowVisible = true
    this.paintWindow.classList.remove('hidden')
    this.taskPaintButton.classList.add('active')
    this.closeStartMenu()
    window.setTimeout(() => this.resizeCanvasToDisplay(true), 0)
  }

  closeWindow() {
    this.minimizeWindow()
    this.clearOverlay()
  }

  toggleMaximizeWindow() {
    this.isWindowMaximized = !this.isWindowMaximized
    this.paintWindow.classList.toggle('maximized', this.isWindowMaximized)
    if (this.isWindowMaximized) {
      this.paintWindow.style.position = 'relative'
      this.paintWindow.style.left = ''
      this.paintWindow.style.top = ''
      this.paintWindow.style.margin = ''
    }
    window.setTimeout(() => this.resizeCanvasToDisplay(true), 0)
  }

  setupEyeDropperAvailability() {
    this.pickerButton.disabled = false
  }

  setupResponsiveCanvas() {
    this.resizeCanvasToDisplay(false)

    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(() => this.resizeCanvasToDisplay(true))
      this.resizeObserver.observe(this.canvasWrap)
      return
    }

    window.addEventListener('resize', () => this.resizeCanvasToDisplay(true))
  }

  resizeCanvasToDisplay(keepDrawing) {
    const wrapStyles = window.getComputedStyle(this.canvasWrap)
    const paddingX = parseFloat(wrapStyles.paddingLeft) + parseFloat(wrapStyles.paddingRight)
    const paddingY = parseFloat(wrapStyles.paddingTop) + parseFloat(wrapStyles.paddingBottom)
    const targetWidth = Math.max(1, Math.floor(this.canvasWrap.clientWidth - paddingX))
    const targetHeight = Math.max(1, Math.floor(this.canvasWrap.clientHeight - paddingY))

    if (this.canvas.width === targetWidth && this.canvas.height === targetHeight) return

    const previousCanvas = document.createElement('canvas')
    previousCanvas.width = this.canvas.width
    previousCanvas.height = this.canvas.height
    const previousCtx = previousCanvas.getContext('2d')
    if (keepDrawing && previousCtx) {
      previousCtx.drawImage(this.canvas, 0, 0)
    }

    this.canvas.width = targetWidth
    this.canvas.height = targetHeight
    this.overlayCanvas.width = targetWidth
    this.overlayCanvas.height = targetHeight

    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
    this.ctx.strokeStyle = this.primaryColor
    this.ctx.fillStyle = this.primaryColor

    if (keepDrawing && previousCtx) {
      this.ctx.drawImage(previousCanvas, 0, 0, targetWidth, targetHeight)
      this.replaceCurrentHistoryEntry()
    }

    this.applyZoom(this.zoom)
    this.setMode(this.mode)
  }

  applyZoom(nextZoom) {
    this.zoom = nextZoom
    const width = `${this.canvas.width * this.zoom}px`
    const height = `${this.canvas.height * this.zoom}px`

    this.canvas.style.width = width
    this.canvas.style.height = height
    this.overlayCanvas.style.width = width
    this.overlayCanvas.style.height = height
  }

  setMode(mode) {
    if (!TOOL_CONFIG[mode]) return

    if (mode !== MODES.PICKER) {
      this.previousNonPickerMode = mode
    }

    this.mode = mode
    this.updateActiveToolUI()
    this.updateStatusTool()

    const config = TOOL_CONFIG[mode]
    this.canvas.style.cursor = config.cursor
    this.ctx.globalCompositeOperation = config.composite
    if (mode === MODES.BRUSH) {
      this.ctx.lineWidth = Math.max(2, this.lineWidth * 2)
    } else if (mode === MODES.ERASE) {
      this.ctx.lineWidth = Math.max(2, this.lineWidth * 2)
    } else {
      this.ctx.lineWidth = this.lineWidth
    }
  }

  updateActiveToolUI() {
    document.querySelector('.tool-btn.active')?.classList.remove('active')
    const { buttonId } = TOOL_CONFIG[this.mode]
    this.getRequiredElement(buttonId).classList.add('active')
  }

  updateStatusTool() {
    const names = {
      [MODES.DRAW]: 'Pencil',
      [MODES.BRUSH]: 'Brush',
      [MODES.ERASE]: 'Eraser',
      [MODES.LINE]: 'Line',
      [MODES.CURVE]: 'Curve',
      [MODES.POLYGON]: 'Polygon',
      [MODES.RECTANGLE]: 'Rectangle',
      [MODES.ROUNDED_RECTANGLE]: 'Rounded Rectangle',
      [MODES.ELLIPSE]: 'Ellipse',
      [MODES.FILL]: 'Fill',
      [MODES.PICKER]: 'Color Picker',
      [MODES.SELECT_FREE]: 'Free Select',
      [MODES.SELECT_RECT]: 'Rectangular Select',
      [MODES.TEXT]: 'Text'
    }
    this.statusTool.textContent = `Tool: ${names[this.mode]}`
  }

  onPointerDown(event) {
    const isMouse = event.pointerType === 'mouse'
    if (isMouse && event.button !== 0 && event.button !== 2) return

    const point = this.getCanvasPoint(event)
    this.updateCoords(point)

    this.activeColor = isMouse && event.button === 2 ? this.secondaryColor : this.primaryColor
    this.applyActiveColor(this.activeColor)

    if (this.mode === MODES.FILL) {
      this.floodFill(Math.floor(point.x), Math.floor(point.y), this.activeColor)
      this.pushHistory()
      return
    }

    if (this.mode === MODES.PICKER) {
      this.pickColorFromCanvas(point, isMouse && event.button === 2)
      this.setMode(this.previousNonPickerMode)
      return
    }

    if (this.mode === MODES.TEXT) {
      this.drawTextAt(point)
      return
    }

    if (this.mode === MODES.SELECT_FREE || this.mode === MODES.SELECT_RECT) {
      this.handleSelectionPointerDown(point, event)
      return
    }

    this.isDrawing = true
    this.startPoint = point
    this.lastPoint = point
    this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    this.canvas.setPointerCapture(event.pointerId)
  }

  onPointerMove(event) {
    const point = this.getCanvasPoint(event)
    this.updateCoords(point)

    if (this.mode === MODES.SELECT_FREE || this.mode === MODES.SELECT_RECT) {
      this.handleSelectionPointerMove(point)
      return
    }

    if (!this.isDrawing) return

    if (this.mode === MODES.DRAW || this.mode === MODES.BRUSH || this.mode === MODES.ERASE) {
      this.drawLine(this.lastPoint, point)
      this.lastPoint = point
      return
    }

    if (SHAPE_MODES.has(this.mode)) {
      this.previewShape(point)
    }
  }

  onPointerUp(event) {
    if (this.mode === MODES.SELECT_FREE || this.mode === MODES.SELECT_RECT) {
      this.handleSelectionPointerUp(event)
      return
    }

    if (!this.isDrawing) return

    this.isDrawing = false
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId)
    }

    this.pushHistory()
  }

  drawLine(from, to) {
    this.ctx.beginPath()
    this.ctx.moveTo(from.x, from.y)
    this.ctx.lineTo(to.x, to.y)
    this.ctx.stroke()
  }

  previewShape(currentPoint) {
    if (!this.snapshot) return

    this.ctx.putImageData(this.snapshot, 0, 0)
    const { width, height } = this.computeShapeSize(currentPoint)
    const centerX = this.startPoint.x + width / 2
    const centerY = this.startPoint.y + height / 2

    this.ctx.beginPath()
    if (this.mode === MODES.LINE) {
      this.ctx.moveTo(this.startPoint.x, this.startPoint.y)
      this.ctx.lineTo(currentPoint.x, currentPoint.y)
      this.ctx.stroke()
      return
    }

    if (this.mode === MODES.CURVE) {
      const ctrlX = (this.startPoint.x + currentPoint.x) / 2
      const ctrlY = (this.startPoint.y + currentPoint.y) / 2 - (height * 0.35)
      this.ctx.moveTo(this.startPoint.x, this.startPoint.y)
      this.ctx.quadraticCurveTo(ctrlX, ctrlY, currentPoint.x, currentPoint.y)
      this.ctx.stroke()
      return
    }

    if (this.mode === MODES.POLYGON) {
      this.drawRegularPolygonPath(centerX, centerY, Math.abs(width) / 2, Math.abs(height) / 2, 6)
      this.finishShapePaint()
      return
    }

    if (this.mode === MODES.RECTANGLE) {
      this.ctx.rect(this.startPoint.x, this.startPoint.y, width, height)
      this.finishShapePaint()
      return
    }

    if (this.mode === MODES.ROUNDED_RECTANGLE) {
      this.addRoundedRectPath(this.startPoint.x, this.startPoint.y, width, height, 8)
      this.finishShapePaint()
      return
    }

    if (this.mode === MODES.ELLIPSE) {
      this.ctx.ellipse(
        this.startPoint.x + width / 2,
        this.startPoint.y + height / 2,
        Math.abs(width) / 2,
        Math.abs(height) / 2,
        0,
        0,
        Math.PI * 2
      )
      this.finishShapePaint()
    }
  }

  finishShapePaint() {
    if (this.fillShapesCheckbox.checked) {
      this.ctx.fill()
    }
    this.ctx.stroke()
  }

  computeShapeSize(currentPoint) {
    let width = currentPoint.x - this.startPoint.x
    let height = currentPoint.y - this.startPoint.y

    if (
      !this.isShiftPressed ||
      this.mode === MODES.LINE ||
      this.mode === MODES.CURVE ||
      this.mode === MODES.POLYGON
    ) {
      return { width, height }
    }

    const side = Math.min(Math.abs(width), Math.abs(height))
    width = Math.sign(width || 1) * side
    height = Math.sign(height || 1) * side
    return { width, height }
  }

  drawRegularPolygonPath(centerX, centerY, radiusX, radiusY, sides) {
    if (sides < 3) return
    for (let i = 0; i < sides; i += 1) {
      const angle = (-Math.PI / 2) + ((Math.PI * 2 * i) / sides)
      const x = centerX + Math.cos(angle) * Math.max(4, radiusX)
      const y = centerY + Math.sin(angle) * Math.max(4, radiusY)
      if (i === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }
    }
    this.ctx.closePath()
  }

  addRoundedRectPath(x, y, w, h, radius) {
    const left = Math.min(x, x + w)
    const top = Math.min(y, y + h)
    const width = Math.abs(w)
    const height = Math.abs(h)
    const r = Math.min(radius, width / 2, height / 2)

    if ('roundRect' in this.ctx) {
      this.ctx.roundRect(left, top, width, height, r)
      return
    }

    this.ctx.moveTo(left + r, top)
    this.ctx.lineTo(left + width - r, top)
    this.ctx.quadraticCurveTo(left + width, top, left + width, top + r)
    this.ctx.lineTo(left + width, top + height - r)
    this.ctx.quadraticCurveTo(left + width, top + height, left + width - r, top + height)
    this.ctx.lineTo(left + r, top + height)
    this.ctx.quadraticCurveTo(left, top + height, left, top + height - r)
    this.ctx.lineTo(left, top + r)
    this.ctx.quadraticCurveTo(left, top, left + r, top)
    this.ctx.closePath()
  }

  handleSelectionPointerDown(point, event) {
    if (this.selection && this.pointInsideRect(point, this.selection)) {
      this.isMovingSelection = true
      this.selectionMoveOffset = { x: point.x - this.selection.x, y: point.y - this.selection.y }
      this.snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    } else {
      this.isSelecting = true
      this.selectionStart = point
      this.freeSelectionPath = [point]
      this.selection = null
      this.clearOverlay()
    }

    this.canvas.setPointerCapture(event.pointerId)
  }

  handleSelectionPointerMove(point) {
    if (!this.isSelecting && !this.isMovingSelection) return

    this.clearOverlay()

    if (this.isSelecting) {
      if (this.mode === MODES.SELECT_FREE) {
        this.freeSelectionPath.push(point)
        this.drawFreeSelectionOutline(this.freeSelectionPath)
      } else {
        const rect = this.getNormalizedRect(this.selectionStart, point)
        this.drawSelectionOutline(rect)
      }
      return
    }

    if (this.isMovingSelection && this.selection && this.snapshot) {
      const nextX = Math.floor(point.x - this.selectionMoveOffset.x)
      const nextY = Math.floor(point.y - this.selectionMoveOffset.y)

      this.ctx.putImageData(this.snapshot, 0, 0)
      this.ctx.clearRect(this.selection.x, this.selection.y, this.selection.w, this.selection.h)
      this.ctx.putImageData(this.selection.imageData, nextX, nextY)

      this.drawSelectionOutline({ x: nextX, y: nextY, w: this.selection.w, h: this.selection.h })
      this.selection.pendingX = nextX
      this.selection.pendingY = nextY
    }
  }

  handleSelectionPointerUp(event) {
    if (!this.isSelecting && !this.isMovingSelection) return

    if (this.isSelecting) {
      this.isSelecting = false
      const point = this.getCanvasPoint(event)
      const rect = this.mode === MODES.SELECT_FREE
        ? this.getBoundsFromPath(this.freeSelectionPath)
        : this.getNormalizedRect(this.selectionStart, point)

      if (rect.w > 1 && rect.h > 1) {
        this.selection = {
          x: rect.x,
          y: rect.y,
          w: rect.w,
          h: rect.h,
          imageData: this.ctx.getImageData(rect.x, rect.y, rect.w, rect.h),
          pendingX: rect.x,
          pendingY: rect.y
        }
        this.drawSelectionOutline(rect)
      } else {
        this.selection = null
        this.clearOverlay()
      }
      this.freeSelectionPath = []
    }

    if (this.isMovingSelection && this.selection && this.snapshot) {
      this.isMovingSelection = false
      const finalX = this.selection.pendingX ?? this.selection.x
      const finalY = this.selection.pendingY ?? this.selection.y

      this.ctx.putImageData(this.snapshot, 0, 0)
      this.ctx.clearRect(this.selection.x, this.selection.y, this.selection.w, this.selection.h)
      this.ctx.putImageData(this.selection.imageData, finalX, finalY)

      this.selection.x = finalX
      this.selection.y = finalY
      this.selection.imageData = this.ctx.getImageData(finalX, finalY, this.selection.w, this.selection.h)
      this.pushHistory()
      this.drawSelectionOutline(this.selection)
    }

    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId)
    }
  }

  drawSelectionOutline(rect) {
    this.overlayCtx.save()
    this.overlayCtx.setLineDash([4, 3])
    this.overlayCtx.strokeStyle = '#000000'
    this.overlayCtx.strokeRect(rect.x + 0.5, rect.y + 0.5, rect.w, rect.h)
    this.overlayCtx.restore()
  }

  drawFreeSelectionOutline(path) {
    if (path.length < 2) return
    this.overlayCtx.save()
    this.overlayCtx.setLineDash([4, 3])
    this.overlayCtx.strokeStyle = '#000000'
    this.overlayCtx.beginPath()
    this.overlayCtx.moveTo(path[0].x, path[0].y)
    for (let i = 1; i < path.length; i += 1) {
      this.overlayCtx.lineTo(path[i].x, path[i].y)
    }
    this.overlayCtx.stroke()
    this.overlayCtx.restore()
  }

  clearOverlay() {
    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height)
  }

  pointInsideRect(point, rect) {
    return point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h
  }

  getNormalizedRect(start, end) {
    const x = Math.floor(Math.min(start.x, end.x))
    const y = Math.floor(Math.min(start.y, end.y))
    const w = Math.floor(Math.abs(end.x - start.x))
    const h = Math.floor(Math.abs(end.y - start.y))
    return { x, y, w, h }
  }

  getBoundsFromPath(path) {
    if (!path.length) return { x: 0, y: 0, w: 0, h: 0 }
    let minX = path[0].x
    let minY = path[0].y
    let maxX = path[0].x
    let maxY = path[0].y

    for (let i = 1; i < path.length; i += 1) {
      minX = Math.min(minX, path[i].x)
      minY = Math.min(minY, path[i].y)
      maxX = Math.max(maxX, path[i].x)
      maxY = Math.max(maxY, path[i].y)
    }

    return {
      x: Math.floor(minX),
      y: Math.floor(minY),
      w: Math.floor(maxX - minX),
      h: Math.floor(maxY - minY)
    }
  }

  drawTextAt(point) {
    const text = window.prompt('Text to insert:')
    if (!text) return

    this.ctx.save()
    this.ctx.globalCompositeOperation = 'source-over'
    this.ctx.fillStyle = this.activeColor
    this.ctx.font = `${Math.max(10, this.lineWidth * 5)}px "Pixelated MS Sans Serif", Arial`
    this.ctx.fillText(text, point.x, point.y)
    this.ctx.restore()
    this.pushHistory()
  }

  floodFill(startX, startY, fillHex) {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    const target = this.getPixelColor(data, startX, startY, width)
    const replacement = this.hexToRgba(fillHex)

    if (this.colorsEqual(target, replacement)) return

    const stack = [[startX, startY]]
    while (stack.length > 0) {
      const [x, y] = stack.pop()
      if (x < 0 || y < 0 || x >= width || y >= height) continue

      const current = this.getPixelColor(data, x, y, width)
      if (!this.colorsEqual(current, target)) continue

      this.setPixelColor(data, x, y, width, replacement)
      stack.push([x + 1, y])
      stack.push([x - 1, y])
      stack.push([x, y + 1])
      stack.push([x, y - 1])
    }

    this.ctx.putImageData(imageData, 0, 0)
  }

  pickColorFromCanvas(point, setSecondary) {
    const pixel = this.ctx.getImageData(Math.floor(point.x), Math.floor(point.y), 1, 1).data
    const hex = this.rgbToHex(pixel[0], pixel[1], pixel[2])

    if (setSecondary) {
      this.secondaryColor = hex
      this.secondaryColorPicker.value = hex
      this.updateColorWells()
      return
    }

    this.primaryColor = hex
    this.colorPicker.value = hex
    this.applyActiveColor(hex)
    this.updateColorWells()
  }

  applyActiveColor(hex) {
    this.ctx.strokeStyle = hex
    this.ctx.fillStyle = hex
  }

  swapColors() {
    const temp = this.primaryColor
    this.primaryColor = this.secondaryColor
    this.secondaryColor = temp
    this.colorPicker.value = this.primaryColor
    this.secondaryColorPicker.value = this.secondaryColor
    this.applyActiveColor(this.primaryColor)
    this.updateColorWells()
  }

  updateColorWells() {
    this.primaryColorWell.style.backgroundColor = this.primaryColor
    this.secondaryColorWell.style.backgroundColor = this.secondaryColor
  }

  async openColorPickerFromScreen() {
    if (!('EyeDropper' in window)) return

    try {
      const eyeDropper = new window.EyeDropper()
      const result = await eyeDropper.open()
      this.primaryColor = result.sRGBHex
      this.colorPicker.value = this.primaryColor
      this.applyActiveColor(this.primaryColor)
      this.updateColorWells()
    } catch {
      // Usuario cancelado o error del API.
    }
  }

  downloadCanvasAsPng() {
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = this.canvas.width
    exportCanvas.height = this.canvas.height

    const exportCtx = exportCanvas.getContext('2d')
    if (!exportCtx) return

    exportCtx.fillStyle = '#ffffff'
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height)
    exportCtx.drawImage(this.canvas, 0, 0)

    const link = document.createElement('a')
    link.href = exportCanvas.toDataURL('image/png')
    link.download = 'paint-win-95.png'
    link.click()
  }

  createNewCanvas() {
    if (!window.confirm('The current canvas will be cleared. Continue?')) return
    this.clearCanvasWithHistory()
  }

  clearCanvasWithHistory() {
    this.clearOverlay()
    this.selection = null
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.pushHistory()
  }

  openImageFile(file) {
    if (!file.type.startsWith('image/')) return

    const image = new Image()
    const reader = new FileReader()
    reader.onload = () => {
      image.onload = () => {
        this.clearOverlay()
        this.selection = null
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        this.ctx.drawImage(image, 0, 0, this.canvas.width, this.canvas.height)
        this.pushHistory()
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  }

  pushHistory() {
    const snapshot = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)

    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1)
    }

    this.history.push(snapshot)
    if (this.history.length > this.maxHistoryEntries) {
      this.history.shift()
    } else {
      this.historyIndex += 1
    }

    if (this.history.length && this.historyIndex < 0) {
      this.historyIndex = 0
    }

    this.updateHistoryButtons()
  }

  replaceCurrentHistoryEntry() {
    if (this.historyIndex < 0 || !this.history.length) return
    this.history[this.historyIndex] = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    this.updateHistoryButtons()
  }

  undo() {
    if (this.historyIndex <= 0) return
    this.historyIndex -= 1
    this.clearOverlay()
    this.selection = null
    this.ctx.putImageData(this.history[this.historyIndex], 0, 0)
    this.updateHistoryButtons()
  }

  redo() {
    if (this.historyIndex >= this.history.length - 1) return
    this.historyIndex += 1
    this.clearOverlay()
    this.selection = null
    this.ctx.putImageData(this.history[this.historyIndex], 0, 0)
    this.updateHistoryButtons()
  }

  updateHistoryButtons() {
    this.undoButton.disabled = this.historyIndex <= 0
    this.redoButton.disabled = this.historyIndex >= this.history.length - 1
  }

  getCanvasPoint(event) {
    const rect = this.canvas.getBoundingClientRect()
    const scaleX = this.canvas.width / rect.width
    const scaleY = this.canvas.height / rect.height
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY
    }
  }

  updateCoords(point) {
    this.statusCoords.textContent = `X: ${Math.max(0, Math.floor(point.x))}, Y: ${Math.max(0, Math.floor(point.y))}`
  }

  getPixelColor(data, x, y, width) {
    const index = (y * width + x) * 4
    return [data[index], data[index + 1], data[index + 2], data[index + 3]]
  }

  setPixelColor(data, x, y, width, rgba) {
    const index = (y * width + x) * 4
    data[index] = rgba[0]
    data[index + 1] = rgba[1]
    data[index + 2] = rgba[2]
    data[index + 3] = rgba[3]
  }

  colorsEqual(a, b) {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3]
  }

  hexToRgba(hex) {
    const clean = hex.replace('#', '')
    const value = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
    const parsed = Number.parseInt(value, 16)
    return [(parsed >> 16) & 255, (parsed >> 8) & 255, parsed & 255, 255]
  }

  rgbToHex(r, g, b) {
    const toHex = (value) => value.toString(16).padStart(2, '0')
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`
  }

  getRequiredElement(id) {
    const element = document.getElementById(id)
    if (!element) {
      throw new Error(`Required element not found: #${id}`)
    }
    return element
  }

}

new PaintApp().init()
