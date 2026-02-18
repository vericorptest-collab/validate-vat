import * as core from "@actions/core";

interface ValidationResult {
  tax_id: string;
  country: string;
  format_valid: boolean;
  vat_valid: boolean | null;
  company_name: string | null;
}

async function validateVat(taxId: string, apiKey: string): Promise<ValidationResult> {
  const url = `https://vericorp-api.p.rapidapi.com/v1/validate/${encodeURIComponent(taxId)}`;

  const response = await fetch(url, {
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": "vericorp-api.p.rapidapi.com",
    },
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status} for ${taxId}`);
  }

  return response.json() as Promise<ValidationResult>;
}

function buildSummaryTable(results: ValidationResult[]): string {
  const lines = [
    "| VAT Number | Country | Format | VAT Valid | Company |",
    "|------------|---------|--------|-----------|---------|",
  ];

  for (const r of results) {
    const format = r.format_valid ? "Valid" : "Invalid";
    const vat = r.vat_valid === true ? "Valid" : r.vat_valid === false ? "Invalid" : "N/A";
    const company = r.company_name || "—";
    lines.push(`| ${r.tax_id} | ${r.country} | ${format} | ${vat} | ${company} |`);
  }

  return lines.join("\n");
}

async function run(): Promise<void> {
  try {
    const vatInput = core.getInput("vat-numbers", { required: true });
    const apiKey = core.getInput("api-key", { required: true });
    const failOnInvalid = core.getInput("fail-on-invalid") === "true";

    const vatNumbers = vatInput
      .split("\n")
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    if (vatNumbers.length === 0) {
      core.setFailed("No VAT numbers provided");
      return;
    }

    core.info(`Validating ${vatNumbers.length} VAT number(s)...`);

    const results: ValidationResult[] = [];

    for (const vat of vatNumbers) {
      try {
        core.info(`  Checking ${vat}...`);
        const result = await validateVat(vat, apiKey);
        results.push(result);

        const status = result.vat_valid ? "valid" : result.format_valid ? "format ok, VAT not confirmed" : "invalid";
        core.info(`  ${vat}: ${status}`);
      } catch (err) {
        core.warning(`Failed to validate ${vat}: ${(err as Error).message}`);
        results.push({
          tax_id: vat,
          country: vat.slice(0, 2),
          format_valid: false,
          vat_valid: null,
          company_name: null,
        });
      }
    }

    const validCount = results.filter((r) => r.vat_valid === true).length;
    const invalidCount = results.filter((r) => r.format_valid === false || r.vat_valid === false).length;
    const summary = buildSummaryTable(results);

    core.setOutput("results", JSON.stringify(results));
    core.setOutput("valid-count", String(validCount));
    core.setOutput("invalid-count", String(invalidCount));
    core.setOutput("summary", summary);

    // Write job summary
    core.summary.addHeading("VAT Validation Results", 2);
    core.summary.addRaw(summary);
    core.summary.addRaw(`\n\n**${validCount} valid**, **${invalidCount} invalid** out of ${results.length} checked.`);
    await core.summary.write();

    if (failOnInvalid && invalidCount > 0) {
      core.setFailed(`${invalidCount} VAT number(s) are invalid`);
    }
  } catch (error) {
    core.setFailed(`Action failed: ${(error as Error).message}`);
  }
}

run();
