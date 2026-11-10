import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { readFile, readdir, stat, access } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { Script } from 'node:vm';
import { build, root, out } from './build.mjs';
import { safePath } from './dev.mjs';
import { snapshotValues, templatizeSnapshotHTML, renderSnapshotHTML } from './snapshot.mjs';

const read = (file) => readFile(resolve(root, file), 'utf8');
const result = await build({ quiet: true });
for (const name of ['app', 'data']) {
  new Script(await readFile(resolve(out, 'assets/' + name + '.js'), 'utf8'), { filename: name + '.js' });
}
new Script(await readFile(resolve(out, 'assets/data.js'), 'utf8') + '\n' + await readFile(resolve(out, 'assets/app.js'), 'utf8'), { filename: 'combined-runtime.js' });
const ids = result.modelData.brands.map((item) => item.id);
assert.equal(new Set(ids).size, ids.length, '品牌 id 重复');
assert(ids.length > 0, '缺少模型');
for (const brand of result.pricing.brands) {
  assert(ids.includes(brand.id), '套餐的品牌 id 无对应模型品牌：' + brand.id);
  assert(Array.isArray(brand.plans), '缺少 plans 数组');
  for (const plan of brand.plans) {
    for (const field of ['monthlyPrice', 'annualMonthlyPrice', 'annualTotal']) {
      if (plan[field] != null) assert(typeof plan[field] === 'number' && Number.isFinite(plan[field]) && plan[field] >= 0, brand.id + ' 的 ' + field + ' 不是有效价格');
    }
  }
}
const localFiles = new Set(['index.html', 'assets/style.css', 'assets/data.js', 'assets/app.js', 'models.json', 'arena-rankings.json', 'pricing.json', 'icons-sources.json', 'LICENSE-LobeHub.txt', 'THIRD_PARTY_NOTICES.md', '.nojekyll']);
for (const file of localFiles) await access(resolve(out, file));
const html = await read('src/index.html');
const builtHTML = await readFile(resolve(out, 'index.html'), 'utf8');
const runtimeData = await readFile(resolve(out, 'assets/data.js'), 'utf8');
assert.equal(new Script(runtimeData + '\nCHECKED;').runInNewContext(), result.modelData.checkedAt, '运行时核验日未跟随模型数据');
for (const field of ['BRANDS', 'MODELS', 'BOARDS', 'PLANS', 'DATE', 'DATE_DOTS', 'CN_PADDED', 'OVERSEAS_PADDED']) {
  assert(html.includes('{{SNAPSHOT_' + field + '}}'), '缺少自动更新的快照字段：' + field);
}
assert.equal(builtHTML, renderSnapshotHTML(html, result.snapshot), '页面快照日期或统计与数据不一致');
assert(!/fonts\.(?:googleapis|gstatic)\.com/.test(html + await read('src/styles.css')), '系统字体版本不应加载在线字体');
// Changing the source date and counts must change every summary, while source dates stay intact.
const fixture = '<span>收录厂商</span><strong>18<small>家</small></strong><span>代表型号</span><strong>61<small>款</small></strong><span>Arena 分类榜</span><strong>11<small>类</small></strong><span>套餐与计费</span><strong>99<small>项</small></strong><p>资料核验至 2026.11.06</p><p>核验时间为 2026-11-06</p><p>资料快照 · 2026.11.06</p><p>核验于 2026.11.06</p><p>读取快照 2026-11-06</p><a download="AI模型核验数据-2026-11-06.json"></a><span>国内厂商 · 07</span><span>海外厂商 · 11</span><p>来源发布于 2026-11-06</p>';
const fixtureData = { checkedAt: '2027-02-03', brands: [{ region: 'cn', models: [{}, {}] }, { region: 'us', models: [{}] }] };
const fixtureValues = snapshotValues(fixtureData, { boards: [{}, {}] }, { brands: [{ plans: [{}, {}, {}] }] });
assert.deepEqual([fixtureValues.BRANDS, fixtureValues.MODELS, fixtureValues.BOARDS, fixtureValues.PLANS], [2, 3, 2, 3]);
const renderedFixture = renderSnapshotHTML(templatizeSnapshotHTML(fixture), fixtureValues);
for (const text of ['<strong>2<small>家', '<strong>3<small>款', '<strong>2<small>类', '<strong>3<small>项', '核验时间为 2027-02-03', '资料核验至 2027.02.03', 'AI模型核验数据-2027-02-03.json', '国内厂商 · 01', '海外厂商 · 01', '来源发布于 2026-11-06']) assert(renderedFixture.includes(text), '快照回归失败：' + text);
assert.throws(() => snapshotValues({ ...fixtureData, checkedAt: '2027-02-30' }, { boards: [] }, { brands: [] }), /有效/);
assert(!/<style\b/i.test(html) && !/<script\b[^>]*>\s*[^<\s]/i.test(html), 'HTML 应引用独立样式和脚本');
assert(!/<base\b/i.test(html), '不应注入改变相对路径的 base 标签');
for (const match of html.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/g)) {
  const url = match[1];
  if (/^(?:https?:|data:|mailto:|#)/i.test(url)) continue;
  assert(!url.startsWith('/'), '本地资源需使用相对路径：' + url);
  const clean = url.split(/[?#]/)[0].replace(/^\.\//, '');
  if (clean) await access(resolve(out, clean));
}
// Pure path regression checks cover encoded and platform-specific traversal attempts.
assert.equal(safePath('/../package.json').error, 400);
assert.equal(safePath('/%2e%2e/package.json').error, 400);
assert.equal(safePath('/%2e%2e%2fpackage.json').error, 400);
assert.equal(safePath('/%5c..%5cpackage.json').error, 400);
assert.equal(safePath('/%00').error, 400);
assert.equal(safePath('/%ZZ').error, 400);
assert.equal(safePath('/assets/app.js', '/guide/').error, 404);
assert.equal(safePath('/guide', '/guide/').redirect, '/guide/');
assert.equal(safePath('/guide/assets/app.js', '/guide/').target, resolve(out, 'assets/app.js'));
assert.equal(safePath('/guide/', '/guide/').target, resolve(out, 'index.html'));

async function walk(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const path = resolve(folder, entry.name);
    assert(!entry.isSymbolicLink(), '项目不应含符号链接：' + relative(root, path));
    if (entry.isDirectory()) await walk(path);
    else {
      const name = relative(root, path);
      assert(!name.split(/[\\/]/).includes('.openai'), '禁止打包托管私有配置');
      assert(!/(^|[\\/])(?:\.env(?:\..*)?|hosting\.json|\.DS_Store)$/.test(name), '不应提交本机配置：' + name);
      if (['.html', '.css', '.js', '.mjs', '.json', '.md', '.yml', '.txt'].includes(extname(path))) {
        const text = await readFile(path, 'utf8');
        assert(!/\/(?:Users|home)\/[^\s"'<>]+/.test(text), '发现本机绝对路径：' + name);
        assert(!/\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-(?:proj-)?[A-Za-z0-9_-]{32,})\b/.test(text), '发现疑似凭证：' + name);
      }
      await stat(path);
    }
  }
}
await walk(root);
console.log('Checked scripts, JSON, relative files, data ids, package contents and traversal cases.');
console.log('Snapshot ' + result.modelData.checkedAt + '; ' + ids.length + ' brands; ' + result.rankings.boards.length + ' boards; ' + result.pricing.brands.reduce((n, b) => n + b.plans.length, 0) + ' plans.');

const videoStates=spawnSync(process.execPath,['tests/hero-video.cjs'],{cwd:root,encoding:'utf8'});
assert.equal(videoStates.status,0,videoStates.stderr||videoStates.stdout);
console.log(videoStates.stdout.trim());
