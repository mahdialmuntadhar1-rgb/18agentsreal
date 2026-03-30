#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const EXPECTED_FILES = [
  'src',
  'server',
  'supabase_schema.sql',
  '.env.example',
  'package.json',
  'vite.config.ts',
  'tsconfig.json',
  'README.md'
];

const SUPABASE_TABLES = {
  agents: ['id', 'name', 'status', 'config', 'created_at', 'updated_at'],
  agent_tasks: ['id', 'agent_id', 'status', 'payload', 'result', 'created_at', 'updated_at'],
  agent_logs: ['id', 'agent_id', 'level', 'message', 'metadata', 'created_at'],
  businesses: ['id', 'place_id', 'name', 'address', 'latitude', 'longitude', 'rating', 'price_level', 'types', 'created_at']
};

const ENV_VARS = {
  client: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_GEMINI_API_KEY'],
  server: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'GOOGLE_PLACES_API_KEY']
};

function readFileSafe(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function parseSupabaseSchema(content) {
  const tables = {};
  const createRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:\w+\.)?(\w+)\s*\(([^;]+?)\);/gis;

  let match = createRegex.exec(content);
  while (match) {
    const tableName = match[1];
    const rawColumns = match[2]
      .split(',')
      .map((column) => column.trim())
      .filter((column) => !/^(CONSTRAINT|PRIMARY\s+KEY|FOREIGN\s+KEY|UNIQUE|CHECK)/i.test(column));

    const columns = rawColumns
      .map((column) => {
        const columnMatch = column.match(/^"?(\w+)"?\s+/);
        return columnMatch ? columnMatch[1] : null;
      })
      .filter(Boolean);

    tables[tableName] = columns;
    match = createRegex.exec(content);
  }

  return tables;
}

function parseEnvVariables(content) {
  return content
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const envMatch = line.match(/^([A-Z0-9_]+)=/);
      return envMatch ? envMatch[1] : null;
    })
    .filter(Boolean);
}

function walkFiles(dir, extensions, collected = []) {
  if (!fileExists(dir)) {
    return collected;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkFiles(fullPath, extensions, collected);
    } else if (extensions.some((ext) => entry.name.endsWith(ext))) {
      collected.push(fullPath);
    }
  }

  return collected;
}

function analyze() {
  console.log('🔍 Running Codex Analyzer...\n');

  const report = {
    warnings: [],
    errors: [],
    info: [],
    todo: []
  };

  report.info.push('## File Structure');
  for (const expected of EXPECTED_FILES) {
    if (fileExists(expected)) {
      report.info.push(`✅ ${expected} exists`);
    } else {
      report.warnings.push(`Expected file or directory missing: ${expected}`);
    }
  }

  const envExample = readFileSafe('.env.example');
  if (!envExample) {
    report.errors.push('.env.example not found');
  } else {
    const envExampleVars = parseEnvVariables(envExample);
    for (const envVar of [...ENV_VARS.client, ...ENV_VARS.server]) {
      if (!envExampleVars.includes(envVar)) {
        report.warnings.push(`Missing ${envVar} in .env.example`);
      }
    }
  }

  const envFile = readFileSafe('.env');
  if (!envFile) {
    report.warnings.push('.env file not found (runtime may fail outside managed environments).');
  } else {
    const runtimeVars = parseEnvVariables(envFile);
    const missingRuntimeVars = [...ENV_VARS.client, ...ENV_VARS.server].filter((envVar) => !runtimeVars.includes(envVar));
    if (missingRuntimeVars.length) {
      report.warnings.push(`Missing env vars in .env: ${missingRuntimeVars.join(', ')}`);
    } else {
      report.info.push('✅ All required env vars are present in .env');
    }
  }

  const schema = readFileSafe('supabase_schema.sql');
  if (!schema) {
    report.errors.push('supabase_schema.sql not found');
  } else {
    report.info.push('## Supabase Schema Analysis');
    const tables = parseSupabaseSchema(schema);

    for (const [tableName, expectedColumns] of Object.entries(SUPABASE_TABLES)) {
      const actualColumns = tables[tableName];
      if (!actualColumns) {
        report.errors.push(`Table ${tableName} not found in supabase_schema.sql`);
        continue;
      }

      const missingColumns = expectedColumns.filter((column) => !actualColumns.includes(column));
      if (missingColumns.length) {
        report.warnings.push(`Table ${tableName} missing columns: ${missingColumns.join(', ')}`);
      } else {
        report.info.push(`✅ Table ${tableName} has all expected columns`);
      }
    }
  }

  const governorFiles = walkFiles('server', ['.ts', '.js']).filter((filePath) => /governor|agent/i.test(path.basename(filePath)));
  if (!governorFiles.length) {
    report.warnings.push('No likely governor/agent files found in server/.');
  } else {
    report.info.push('## Agent Implementation');
    let foundRestaurantsGovernor = false;

    for (const filePath of governorFiles) {
      const content = readFileSafe(filePath);
      if (!content || !content.includes('RestaurantsGovernor')) {
        continue;
      }

      foundRestaurantsGovernor = true;
      if (content.includes('BaseGovernor') && content.includes('GOOGLE_PLACES_API_KEY')) {
        report.info.push('✅ Agent-01 (RestaurantsGovernor) appears connected to BaseGovernor and Google Places config.');
      } else {
        report.warnings.push('RestaurantsGovernor detected, but BaseGovernor inheritance or GOOGLE_PLACES_API_KEY handling looks incomplete.');
      }
    }

    if (!foundRestaurantsGovernor) {
      report.errors.push('Agent-01 (RestaurantsGovernor) not found in governor/agent server files.');
    }
  }

  const orchestratorSource = readFileSafe('server.ts');
  if (!orchestratorSource) {
    report.errors.push('server.ts not found');
  } else if (
    orchestratorSource.includes('/api/orchestrator/start')
    && orchestratorSource.includes('/api/orchestrator/stop')
  ) {
    report.info.push('✅ Orchestrator start/stop endpoints found in server.ts');
    if (
      orchestratorSource.includes('agents')
      && orchestratorSource.includes('agent_tasks')
      && orchestratorSource.includes('agent_logs')
    ) {
      report.info.push('✅ Orchestrator code references Supabase runtime tables (agents, agent_tasks, agent_logs).');
    } else {
      report.warnings.push('Orchestrator endpoints found but table persistence references are incomplete.');
    }
  } else {
    report.warnings.push('Orchestrator endpoints are missing or incomplete in server.ts');
  }

  const srcFiles = walkFiles('src', ['.tsx', '.ts', '.jsx', '.js']);
  const placeholders = srcFiles
    .filter((filePath) => {
      const content = readFileSafe(filePath);
      return content && /placeholder|non-operational/i.test(content);
    })
    .map((filePath) => filePath.replace(/^src\//, ''));

  if (placeholders.length) {
    report.todo.push(`Placeholder components/pages detected: ${placeholders.join(', ')}`);
  } else {
    report.info.push('✅ No explicit placeholder markers found in src/.');
  }

  try {
    execSync('npm run lint', { stdio: 'pipe' });
    report.info.push('✅ npm run lint passes');
  } catch {
    report.warnings.push('npm run lint failed. Review TypeScript and project quality issues.');
  }

  const readme = readFileSafe('README.md');
  if (!readme) {
    report.warnings.push('README.md not found.');
  } else if (readme.includes('First real scraping test contract') && readme.includes('RestaurantsGovernor')) {
    report.info.push('✅ README first real scraping contract appears aligned with RestaurantsGovernor runtime claim.');
  } else {
    report.warnings.push('README may be out of date for the first scraping test contract.');
  }

  const timestamp = new Date().toISOString();
  let markdown = '# Codex Analysis Report\n\n';
  markdown += `Generated: ${timestamp}\n\n`;
  markdown += '## Summary\n';
  markdown += `- ${report.warnings.length} warning(s)\n`;
  markdown += `- ${report.errors.length} error(s)\n`;
  markdown += `- ${report.todo.length} TODO item(s)\n\n`;

  if (report.errors.length) {
    markdown += '## ❌ Errors (Must Fix)\n';
    markdown += `${report.errors.map((error) => `- ${error}`).join('\n')}\n\n`;
  }

  if (report.warnings.length) {
    markdown += '## ⚠️ Warnings (Should Address)\n';
    markdown += `${report.warnings.map((warning) => `- ${warning}`).join('\n')}\n\n`;
  }

  if (report.todo.length) {
    markdown += '## 📝 Remaining Work (TODO)\n';
    markdown += `${report.todo.map((todo) => `- ${todo}`).join('\n')}\n\n`;
  }

  markdown += '## ℹ️ Detailed Info\n';
  markdown += `${report.info.map((line) => `- ${line}`).join('\n')}\n`;

  fs.writeFileSync('CODEX_REPORT.md', markdown, 'utf8');
  console.log('✅ Report saved to CODEX_REPORT.md');
}

analyze();
