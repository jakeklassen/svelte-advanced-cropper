import { mkdir, readdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as sass from 'sass'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const enginePkg = resolve(projectRoot, 'node_modules/advanced-cropper')
const distDir = resolve(projectRoot, 'dist')
const distThemesDir = join(distDir, 'themes')

async function compile(entry, outFile) {
  const result = sass.compile(entry, {
    style: 'compressed',
    silenceDeprecations: ['import', 'global-builtin'],
  })
  await mkdir(dirname(outFile), { recursive: true })
  await writeFile(outFile, result.css)
  return result.css.length
}

await mkdir(distDir, { recursive: true })
await mkdir(distThemesDir, { recursive: true })

const coreSize = await compile(join(enginePkg, 'styles/index.scss'), join(distDir, 'style.css'))
console.log(`  dist/style.css (${coreSize} bytes)`)

const themes = (await readdir(join(enginePkg, 'themes'))).filter((f) => f.endsWith('.scss'))
for (const theme of themes) {
  const outName = theme.replace(/\.scss$/, '.css')
  const size = await compile(join(enginePkg, 'themes', theme), join(distThemesDir, outName))
  console.log(`  dist/themes/${outName} (${size} bytes)`)
}
