# Validate VAT — GitHub Action

Validate European VAT numbers in your CI/CD pipeline using the [VeriCorp API](https://rapidapi.com/vericorp/api/vericorp-api).

## Usage

```yaml
- uses: vericorptest-collab/validate-vat@v1
  with:
    vat-numbers: |
      PT502011378
      DK10150817
      DE811871080
    api-key: ${{ secrets.VERICORP_API_KEY }}
    fail-on-invalid: "true"
```

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| `vat-numbers` | Yes | VAT numbers to validate (one per line) |
| `api-key` | Yes | RapidAPI key for VeriCorp API |
| `fail-on-invalid` | No | Fail if any VAT is invalid (default: `false`) |

## Outputs

| Output | Description |
|--------|-------------|
| `results` | JSON array of validation results |
| `valid-count` | Number of valid VAT numbers |
| `invalid-count` | Number of invalid VAT numbers |
| `summary` | Markdown table of results |

## Job Summary

The action automatically writes a summary table to the GitHub Actions job summary.

## License

MIT
