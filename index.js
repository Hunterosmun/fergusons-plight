const map1 = require('./map1.json')
const map2 = require('./map2.json')
const map3 = require('./map3.json')
const map4 = require('./map4.json')
const character = require('./character.json')

// hello hunter!!

const maps = {
  start: map1,
  second: map2,
  third: map3,
  fourth: map4
}

const loadedMaps = {}
let mapID = 'start'
let items, doors, map, finish, warps

function loadMap () {
  if (mapID in loadedMaps) {
    const mapData = loadedMaps[mapID]
    map = mapData.map
    items = mapData.items
    doors = mapData.doors
    warps = mapData.warps
    finish = mapData.finish
    return
  }

  map = maps[mapID].map
  items = []
  doors = []
  finish = null
  warps = []

  for (let y = 0; y < map.length; ++y) {
    for (let x = 0; x < map[y].length; ++x) {
      const num = map[y][x]
      if (num !== 1 && num !== 0) {
        const obj = maps[mapID].inMap[num]
        if (obj.type === 'door') doors.push({ ...obj, loc: { x, y } })
        if (obj.type === 'key') items.push({ ...obj, loc: { x, y } })
        if (obj.type === 'warp') warps.push({ ...obj, loc: { x, y } })
        if (obj.type === 'finish') finish = { loc: { x, y } }
        if (obj.type === 'start') character.loc = { x, y }
      }
    }
  }
  loadedMaps[mapID] = { doors, items, warps, finish, map }
}

const colors = {
  // white: msg => `\x1b[37m${msg}\x1b[0m`,
  // black: msg => `\x1b[30m${msg}\x1b[0m`,
  red: msg => `\x1b[31m${msg}\x1b[0m`,
  green: msg => `\x1b[32m${msg}\x1b[0m`,
  blue: msg => `\x1b[34m${msg}\x1b[0m`,
  yellow: msg => `\x1b[33m${msg}\x1b[0m`,
  magenta: msg => `\x1b[35m${msg}\x1b[0m`,
  cyan: msg => `\x1b[36m${msg}\x1b[0m`
}

function colorize ({ color }, message) {
  if (color in colors) {
    return colors[color](message)
  }
  return message
}

function drawMap () {
  console.clear()
  console.log('\n')
  for (let y = 0; y < map.length; ++y) {
    let line = '                    '
    for (let x = 0; x < map[y].length; ++x) {
      line += renderCell(x, y)
    }
    console.log(line)
  }
  if (character.inventory) {
    console.log(`\n                    Inventory:${renderInventory()}`)
  }
}

function renderCell (x, y) {
  if (collides(character, { x, y })) return '???'
  if (finish && collides(finish, { x, y })) return '???'
  if (map[y][x] === 1) return '???'
  for (const item of items) {
    if (collides(item, { x, y })) return colorize(item, '?')
  }
  for (const door of doors) {
    if (collides(door, { x, y })) return colorize(door, '*')
  }
  for (const warp of warps) {
    if (collides(warp, { x, y })) return colorize(warp, '???')
  }
  return ' '
}

function renderInventory () {
  if (!character.inventory) return ''
  return colorize(character.inventory, '?')
}

function collides (obj, { x, y }) {
  return obj.loc.x === x && obj.loc.y === y
}

function tick ({ x = 0, y = 0 }) {
  const newLoc = { x: character.loc.x + x, y: character.loc.y + y }
  if (map[newLoc.y][newLoc.x] === 1) return
  if (newLoc.y >= map.length || newLoc.x >= map[0].length) return

  const doorIndex = doors.findIndex(door => collides(door, newLoc))
  if (doorIndex !== -1) {
    const door = doors[doorIndex]
    if (character.inventory?.color === door.color) {
      character.inventory = null
      doors.splice(doorIndex, 1)
    } else {
      return
    }
  }

  const warp = warps.find(warp => collides(warp, newLoc))
  if (warp) {
    mapID = warp.to
    loadMap()

    const goto = warps.find(warp2 => warp2.num === warp.correlation)
    character.loc = { x: goto.loc.x + x, y: goto.loc.y + y }

    drawMap()
    return
  }

  if (finish && collides(finish, newLoc)) {
    character.loc = newLoc
    drawMap()
    console.log('\n\n\n                    YOU WIN!!!!!!\n\n\n')
    process.exit()
  }

  const itemIndex = items.findIndex(item => collides(item, newLoc))
  if (itemIndex !== -1) {
    const [item] = items.splice(itemIndex, 1)
    if (character.inventory) {
      items.push({ ...character.inventory, loc: newLoc })
    }
    character.inventory = item
  }

  character.loc = { ...newLoc }
  drawMap()
}

// eslint-disable-next-line
function testMap () {
  const solution = maps[mapID].solution.split('')
  let i = 0
  const intervalID = setInterval(() => {
    const instruction = solution[i]

    if (instruction === 'r') tick({ x: 1 })
    if (instruction === 'l') tick({ x: -1 })
    if (instruction === 'u') tick({ y: -1 })
    if (instruction === 'd') tick({ y: 1 })

    i++
    if (solution.length === i) clearInterval(intervalID)
  }, 20)
}

process.stdin.setRawMode(true)
process.stdin.resume()
process.stdin.setEncoding('utf8')
process.stdin.on('data', function (key) {
  if (key === '\u0003') process.exit()
  if (key === 'w') tick({ y: -1 })
  if (key === 's') tick({ y: 1 })
  if (key === 'a') tick({ x: -1 })
  if (key === 'd') tick({ x: 1 })
  if (key === '\x1B[A') tick({ y: -1 })
  if (key === '\x1B[B') tick({ y: 1 })
  if (key === '\x1B[D') tick({ x: -1 })
  if (key === '\x1B[C') tick({ x: 1 })
})

loadMap()
drawMap()
// testMap()
