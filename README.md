# simple-a11y-check

Scans PR-added UI lines for common accessibility anti-patterns (missing alt, unlabeled inputs, clickable divs).

## Usage

```yaml
- uses: dmytropaduchak/simple-a11y-check@v0.1.0
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Develop

```bash
npm install && npm run build
```
