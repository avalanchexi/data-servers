const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const repositoryRoot = path.join(__dirname, '..', '..');

function read(relativePath) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

test('the project exposes the current AgenticOS design skill for explicit invocation only', () => {
  const currentSkill = path.join(repositoryRoot, '.agents/skills/agenticos-design-system/SKILL.md');
  const retiredSkill = path.join(repositoryRoot, '.agents/skills/enterprise-prototype-design');

  assert.equal(fs.existsSync(currentSkill), true, 'current project skill must exist');
  assert.equal(fs.existsSync(retiredSkill), false, 'retired project skill must be removed');
  assert.match(read('AGENTS.md'), /\$agenticos-design-system.*仅在用户显式输入/s);
  assert.match(read('.agents/skills/agenticos-design-system/agents/openai.yaml'), /allow_implicit_invocation:\s*false/);
});

test('the current skill resolves the canonical project design system', () => {
  const skill = read('.agents/skills/agenticos-design-system/SKILL.md');
  const tokens = read('frontend/design-system/tokens.css');
  const example = read('frontend/design-system/example.html');

  assert.match(skill, /frontend\/design-system/);
  assert.match(tokens, /--shell-topbar-height:\s*56px/);
  assert.match(tokens, /--shell-sidebar-width:\s*240px/);
  assert.match(tokens, /--color-primary:\s*#5b6cf0/i);
  assert.doesNotMatch(tokens, /--ds-/);
  assert.match(example, /href="\.\/tokens\.css"/);
  assert.doesNotMatch(example, /--ds-/);
});

test('migration tasks automatically resolve the governed migration process', () => {
  const skill = read('.agents/skills/agenticos-design-system/SKILL.md');
  const migration = read('frontend/design-system/migration.md');
  const aiGuide = read('frontend/design-system/ai-guide.md');
  const validator = read('frontend/design-system/validate.mjs');

  assert.match(skill, /description:.*migrate/i);
  assert.match(skill, /frontend\/design-system\/migration\.md/);
  assert.match(aiGuide, /\.\/migration\.md/);
  assert.match(validator, /migration\.md/);
  for (const gate of ['Gate 1', 'Gate 2', 'Gate 3', 'Gate 4']) {
    assert.match(migration, new RegExp(gate));
  }
});
