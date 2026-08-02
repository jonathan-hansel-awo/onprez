import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const configPath = path.join(root, 'config/test-pyramid.json')
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
const failures = []

function fail(message) {
  failures.push(message)
}

function normalise(filePath) {
  return filePath.split(path.sep).join('/')
}

function escapeRegex(character) {
  return /[\\^$.*+?()[\]{}|]/.test(character) ? `\\${character}` : character
}

function globToRegex(glob) {
  let source = '^'

  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index]

    if (character === '*') {
      if (glob[index + 1] === '*') {
        index += 1
        if (glob[index + 1] === '/') {
          index += 1
          source += '(?:.*/)?'
        } else {
          source += '.*'
        }
      } else {
        source += '[^/]*'
      }
    } else if (character === '?') {
      source += '[^/]'
    } else {
      source += escapeRegex(character)
    }
  }

  return new RegExp(`${source}$`)
}

const compiledPatterns = new Map()
function matches(filePath, pattern) {
  if (!compiledPatterns.has(pattern)) compiledPatterns.set(pattern, globToRegex(pattern))
  return compiledPatterns.get(pattern).test(filePath)
}

function walk(directory, files = []) {
  if (!fs.existsSync(directory)) return files

  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (
      entry.isDirectory() &&
      ['.git', '.next', 'artifacts', 'node_modules'].includes(entry.name)
    ) {
      continue
    }
    const absolute = path.join(directory, entry.name)
    if (entry.isDirectory()) walk(absolute, files)
    else files.push(normalise(path.relative(root, absolute)))
  }

  return files
}

function isTestFile(filePath) {
  return config.discovery.fileSuffixes.some(suffix => filePath.endsWith(suffix))
}

function layersFor(filePath) {
  return config.layers
    .filter(layer => layer.patterns.some(pattern => matches(filePath, pattern)))
    .map(layer => layer.id)
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function validateConfiguration() {
  if (config.schemaVersion !== 1) fail('Unsupported test-pyramid schemaVersion')

  const layerIds = new Set()
  for (const layer of config.layers) {
    if (!layer.id || layerIds.has(layer.id)) fail(`Duplicate or empty layer id: ${layer.id}`)
    layerIds.add(layer.id)
    if (!layer.owner?.trim()) fail(`${layer.id} is missing an owner policy`)
    if (!Array.isArray(layer.patterns) || layer.patterns.length === 0) {
      fail(`${layer.id} has no classification patterns`)
    }
  }

  for (const rule of config.changeRules) {
    for (const layer of rule.requiredLayers) {
      if (!layerIds.has(layer)) fail(`${rule.id} references unknown layer ${layer}`)
    }
  }
}

function validateInventory() {
  const testFiles = config.discovery.roots
    .flatMap(directory => walk(path.join(root, directory)))
    .filter(isTestFile)
    .sort()
  const counts = Object.fromEntries(config.layers.map(layer => [layer.id, 0]))

  for (const filePath of testFiles) {
    const classifications = layersFor(filePath)
    if (classifications.length === 0) fail(`Unclassified test file: ${filePath}`)
    if (classifications.length > 1) {
      fail(`Test file belongs to multiple layers (${classifications.join(', ')}): ${filePath}`)
    }
    if (classifications.length === 1) counts[classifications[0]] += 1

    const source = read(filePath)
    if (/\b(?:describe|it|test)\.only\s*\(/.test(source))
      fail(`Focused test committed: ${filePath}`)
  }

  for (const layer of config.layers) {
    if (counts[layer.id] < layer.minimumFiles) {
      fail(`${layer.id} has ${counts[layer.id]} files; minimum is ${layer.minimumFiles}`)
    }
  }

  const foundation = config.shape.foundationLayers.reduce((sum, layer) => sum + counts[layer], 0)
  const higher = config.shape.higherLayers.reduce((sum, layer) => sum + counts[layer], 0)
  if (foundation < higher) {
    fail(`Test pyramid inverted: ${foundation} foundation files for ${higher} higher-layer files`)
  }

  for (const layer of config.plannedLayers) {
    const discovered = walk(root).filter(filePath =>
      layer.paths.some(pattern => matches(filePath, pattern))
    )
    if (layer.state === 'planned' && discovered.length > 0) {
      fail(
        `${layer.id} files exist but config still marks the layer planned (${layer.trackerItem})`
      )
    }
  }

  return { counts, testFiles: testFiles.length }
}

function validateDocumentationAndGates() {
  const document = read(config.strategyDocument)
  for (const heading of [
    '## Pyramid layers',
    '## Ownership',
    '## Required layers by change type',
    '## Database-test policy',
    '## Release gates',
    '## Exceptions and regression fixes',
  ]) {
    if (!document.includes(heading)) fail(`Testing strategy is missing heading: ${heading}`)
  }
  if (!document.includes('config/test-pyramid.json')) {
    fail('Testing strategy must identify config/test-pyramid.json as the machine-readable policy')
  }

  const packageJson = JSON.parse(read('package.json'))
  for (const script of config.requiredPackageScripts) {
    if (!packageJson.scripts?.[script]) fail(`package.json is missing required script ${script}`)
  }

  for (const gate of config.releaseGates) {
    const workflow = read(gate.workflow)
    for (const command of gate.requiredCommands) {
      if (!workflow.includes(command)) fail(`${gate.workflow} is missing release gate: ${command}`)
    }
  }
}

function changedFilesFromGit(baseSha) {
  if (!baseSha || /^0+$/.test(baseSha)) return []
  try {
    return execFileSync('git', ['diff', '--name-only', `${baseSha}...HEAD`], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
      .split(/\r?\n/)
      .filter(Boolean)
      .map(normalise)
  } catch (error) {
    fail(
      `Unable to inspect changed files from ${baseSha}: ${error.stderr?.trim() || error.message}`
    )
    return []
  }
}

function validateChangedFiles(baseSha) {
  const changedFiles = changedFilesFromGit(baseSha)
  if (changedFiles.length === 0) return { baseSha: baseSha || null, checked: false, rules: [] }

  const changedTests = changedFiles.filter(isTestFile)
  const changedLayers = new Set(changedTests.flatMap(layersFor))
  const exercisedRules = []

  for (const rule of config.changeRules) {
    const changedSources = changedFiles.filter(filePath =>
      rule.sourcePatterns.some(pattern => matches(filePath, pattern))
    )
    if (changedSources.length === 0) continue

    exercisedRules.push(rule.id)
    if (!rule.requiredLayers.some(layer => changedLayers.has(layer))) {
      fail(
        `${rule.id} changes require a ${rule.requiredLayers.join(' or ')} test change; changed source: ${changedSources.join(', ')}`
      )
    }
  }

  return { baseSha, checked: true, rules: exercisedRules }
}

validateConfiguration()
const inventory = validateInventory()
validateDocumentationAndGates()
const changes = validateChangedFiles(process.env.TEST_PYRAMID_BASE_SHA)

if (failures.length > 0) {
  console.error('Test pyramid validation failed:')
  for (const message of failures) console.error(`- ${message}`)
  process.exit(1)
}

console.log(
  `Test pyramid valid: ${inventory.testFiles} files (${Object.entries(inventory.counts)
    .map(([layer, count]) => `${layer}=${count}`)
    .join(', ')})`
)
if (changes.checked) {
  console.log(
    changes.rules.length > 0
      ? `Changed-file rules passed: ${changes.rules.join(', ')}`
      : 'Changed-file rules passed: no governed production source changed'
  )
}
