import assert from 'node:assert/strict';

export function snapshotValues(modelData, rankings, pricing) {
  const checkedAt = modelData.checkedAt;
  assert.equal(typeof checkedAt, 'string', 'models.json.checkedAt 必须是日期字符串');
  const parsedDate = new Date(checkedAt + 'T00:00:00Z');
  assert(/^\d{4}-\d{2}-\d{2}$/.test(checkedAt) && Number.isFinite(parsedDate.valueOf()) && parsedDate.toISOString().slice(0, 10) === checkedAt, 'models.json.checkedAt 必须是有效的 YYYY-MM-DD 日期');
  return {
    DATE: checkedAt,
    DATE_DOTS: checkedAt.replace(/-/g, '.'),
    BRANDS: modelData.brands.length,
    MODELS: modelData.brands.reduce((sum, brand) => sum + brand.models.length, 0),
    BOARDS: rankings.boards.length,
    PLANS: pricing.brands.reduce((sum, brand) => sum + brand.plans.length, 0),
    CN_PADDED: String(modelData.brands.filter((brand) => brand.region === 'cn').length).padStart(2, '0'),
    OVERSEAS_PADDED: String(modelData.brands.filter((brand) => brand.region === 'us').length).padStart(2, '0'),
  };
}

// Mark only snapshot summary fields, never dates in model/source records.
export function templatizeSnapshotHTML(html) {
  const stats = [
    ['收录厂商', 'BRANDS'], ['代表型号', 'MODELS'],
    ['Arena 分类榜', 'BOARDS'], ['套餐与计费', 'PLANS'],
  ];
  let output = html;
  for (const [label, token] of stats) {
    const pattern = new RegExp('(<span>' + label + '</span>\\s*<strong>)\\d+(?=\\s*<small>)', 'g');
    let count = 0;
    output = output.replace(pattern, (_, before) => { count++; return before + '{{SNAPSHOT_' + token + '}}'; });
    assert.equal(count, 1, '未找到唯一的快照统计字段：' + label + '。请同步 scripts/snapshot.mjs 的模板标记。');
  }
  output = output
    .replace(/(资料快照\s*·\s*|核验于\s*|资料核验至\s*)\d{4}\.\d{2}\.\d{2}/g, '$1{{SNAPSHOT_DATE_DOTS}}')
    .replace(/(核验时间为\s*|读取快照\s*)\d{4}-\d{2}-\d{2}/g, '$1{{SNAPSHOT_DATE}}')
    .replace(/(download=["']AI模型核验数据-)\d{4}-\d{2}-\d{2}(\.json["'])/g, '$1{{SNAPSHOT_DATE}}$2')
    .replace(/(国内厂商\s*·\s*)\d+/g, '$1{{SNAPSHOT_CN_PADDED}}')
    .replace(/(海外厂商\s*·\s*)\d+/g, '$1{{SNAPSHOT_OVERSEAS_PADDED}}');
  assert(output.includes('{{SNAPSHOT_DATE_DOTS}}') && output.includes('{{SNAPSHOT_DATE}}'), '未找到快照日期字段');
  return output;
}

export function renderSnapshotHTML(html, values) {
  const output = html.replace(/\{\{SNAPSHOT_([A-Z_]+)\}\}/g, (_, key) => {
    assert(Object.hasOwn(values, key), '未知的快照模板字段：' + key);
    return String(values[key]);
  });
  assert(!output.includes('{{SNAPSHOT_'), '未填充的快照模板字段');
  return output;
}
