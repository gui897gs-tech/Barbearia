import { spawnSync } from "node:child_process";

const npmCli = process.env.npm_execpath;
const command = npmCli ? process.execPath : process.platform === "win32" ? "npm.cmd" : "npm";
const args = npmCli ? [npmCli, "audit", "--omit=dev", "--json"] : ["audit", "--omit=dev", "--json"];
const result = spawnSync(command, args, {
  encoding: "utf8",
  shell: false,
});

if (result.error || !result.stdout?.trim()) {
  process.stderr.write(
    result.error?.message || result.stderr || "A auditoria npm não retornou um relatório.\n",
  );
  process.exit(result.status || 1);
}

let report;
try {
  report = JSON.parse(result.stdout);
} catch {
  process.stderr.write("Não foi possível interpretar o relatório do npm audit.\n");
  process.exit(1);
}

if (result.status === 0) {
  console.log("Auditoria de produção aprovada sem vulnerabilidades altas.");
  process.exit(0);
}

const temporaryAllowlist = new Map([
  [
    1247710,
    {
      package: "picomatch",
      advisory: "GHSA-fc5q-39xc-vjpf",
      reason: "O fornecedor ainda não publicou uma versão corrigida.",
    },
  ],
]);

const advisories = Object.values(report.vulnerabilities ?? {}).flatMap((vulnerability) =>
  (vulnerability.via ?? []).filter((item) => typeof item === "object"),
);
const unexpected = advisories.filter((advisory) => {
  const allowed = temporaryAllowlist.get(advisory.source);
  return !allowed || allowed.package !== advisory.dependency;
});

if (!advisories.length || unexpected.length) {
  process.stderr.write("A auditoria encontrou uma vulnerabilidade não autorizada.\n");
  for (const advisory of unexpected) {
    process.stderr.write(`- ${advisory.name}: ${advisory.title} (${advisory.url})\n`);
  }
  process.exit(1);
}

for (const allowed of temporaryAllowlist.values()) {
  console.warn(
    `Aviso temporariamente autorizado: ${allowed.advisory} em ${allowed.package}. ${allowed.reason}`,
  );
}
