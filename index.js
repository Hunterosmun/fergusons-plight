const map1 = require('./map1.json')
const map2 = require('./map2.json')
const character = require('./character.json')

// character.loc = findOne(map, 2)
// const items = [
//   { type: 'key', loc: findOne(map, 4), color: 'red' },
//   { type: 'key', loc: findOne(map, 6), color: 'green' },
//   { type: 'key', loc: findOne(map, 8), color: 'blue' }
// ]
// const doors = [
//   { status: 'victory', loc: findOne(map, 3) },
//   { status: 'locked', loc: findOne(map, 5), color: 'red' },
//   { status: 'locked', loc: findOne(map, 7), color: 'green' },
//   { status: 'locked', loc: findOne(map, 9), color: 'blue' }
// ]
const maps = {
  start: map1,
  second: map2
}
const loadedMaps = {}
let mapID = 'start'
let items, doors, map, finish, warps

function loadMap () {
  if (mapID in loadedMaps) {
    const mapdata = loadedMaps[mapID]
    map = mapdata.map
    items = mapdata.items
    doors = mapdata.doors
    warps = mapdata.warps
    finish = mapdata.finish
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
        if (obj.type === 'door') {
          doors.push({ ...obj, loc: { x, y } })
        }
        if (obj.type === 'key') {
          items.push({ ...obj, loc: { x, y } })
        }
        if (obj.type === 'finish') {
          finish = { loc: { x, y } }
        }
        if (obj.type === 'start') {
          // doors.push({ type: 'start', loc: { x, y } })
          character.loc = { x, y }
        }
        if (obj.type === 'warp') {
          warps.push({ ...obj, loc: { x, y } })
        }
      }
    }
  }
  loadedMaps[mapID] = {
    doors,
    items,
    warps,
    finish,
    map
  }
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

function colorize (color, message) {
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
  if (collides(character, x, y)) return '☺'
  if (finish && collides(finish, x, y)) return '⚐'
  if (map[y][x] === 1) return '█'
  // if (loop(items, x, y)) return colorize(items[i].color, '?')
  for (let i = 0; i < items.length; i++) {
    if (collides(items[i], x, y)) return colorize(items[i].color, '?')
  }
  for (let i = 0; i < doors.length; i++) {
    if (collides(doors[i], x, y)) return colorize(doors[i].color, '*')
  }
  for (let i = 0; i < warps.length; i++) {
    if (collides(warps[i], x, y)) return colorize(warps[i].color, '⚘')
  }
  return ' '
}

// function loop (array, x, y) {
//   for (let i = 0; i < array.length; i++) {
//     if (collides(array[i], x, y)) return array[i]
//   }
//   return false
// }

function renderInventory () {
  if (!character.inventory) {
    return ''
  } else return colorize(character.inventory.color, '?')
}

function collides (obj, x, y) {
  return obj.loc.x === x && obj.loc.y === y
}

// determine character start location, and set it on player

// function findOne (map, code) {
//   for (let y = 0; y < map.length; ++y) {
//     for (let x = 0; x < map[y].length; ++x) {
//       if (map[y][x] === code) {
//         return { x, y }
//       }
//     }
//   }
// }

loadMap()
drawMap()
testMap()

// console.log({ map, character })
// 🚪 🔑 █ █

process.stdin.setRawMode(true)
process.stdin.resume()
process.stdin.setEncoding('utf8')
process.stdin.on('data', function (key) {
  if (key === '\u0003') {
    process.exit()
  }
  if (key === 'w') tick({ y: -1 })
  if (key === 's') tick({ y: +1 })
  if (key === 'a') tick({ x: -1 })
  if (key === 'd') tick({ x: +1 })
  if (key === '\x1B[A') tick({ y: -1 })
  if (key === '\x1B[B') tick({ y: +1 })
  if (key === '\x1B[D') tick({ x: -1 })
  if (key === '\x1B[C') tick({ x: +1 })
})

function tick ({ x = 0, y = 0 }) {
  const newloc = { x: character.loc.x + x, y: character.loc.y + y }
  if (map[newloc.y][newloc.x] === 1) return
  if (newloc.y >= map.length || newloc.x >= map[0].length) return

  const doorIndex = doors.findIndex(door => collides(door, newloc.x, newloc.y))
  if (doorIndex !== -1) {
    const door = doors[doorIndex]
    if (character.inventory?.color === door.color) {
      character.inventory = null
      doors.splice(doorIndex, 1)
    } else {
      return
    }
  }

  const warp = warps.find(warp => collides(warp, newloc.x, newloc.y))
  if (warp) {
    mapID = warp.to
    loadMap()

    const goto = warps.find(warp2 => warp2.num === warp.correlation)
    character.loc = { x: goto.loc.x + x, y: goto.loc.y + y }

    drawMap()
    return
  }

  if (finish && collides(finish, newloc.x, newloc.y)) {
    character.loc = newloc
    drawMap()
    console.log('\n\n\n                    YOU WIN!!!!!!\n\n\n')
    process.exit()
  }

  const itemIndex = items.findIndex(item => collides(item, newloc.x, newloc.y))
  if (itemIndex !== -1) {
    const [item] = items.splice(itemIndex, 1)
    if (character.inventory) {
      items.push({ ...character.inventory, loc: newloc })
    }
    character.inventory = item
  }

  character.loc = { ...newloc }
  drawMap()
}

//
//
// eslint-disable-next-line
function testMap () {
  const solution = maps[mapID].solution.split('')
  let i = 0
  const intervalID = setInterval(() => {
    const instruction = solution[i]
    if (instruction === 'r') {
      tick({ x: 1 })
    }
    if (instruction === 'l') {
      tick({ x: -1 })
    }
    if (instruction === 'u') {
      tick({ y: -1 })
    }
    if (instruction === 'd') {
      tick({ y: 1 })
    }

    i++
    if (solution.length === i) clearInterval(intervalID)
  }, 9)
}
