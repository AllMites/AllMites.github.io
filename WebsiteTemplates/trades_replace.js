const fs = require('fs');
const path = require('path');

const configFile = process.argv[2] || 'trades_config.json';
const configPath = path.join(__dirname, configFile);
const templatePath = path.join(__dirname, 'trades_business_template.html');
const outputArg = process.argv[3];
const outputPath = outputArg
  ? path.resolve(process.cwd(), outputArg)
  : path.join(__dirname, 'trades_output', 'index.html');

try {
  if (!fs.existsSync(configPath)) {
    console.error('Could not find trades_config.json. Make sure it exists in the same directory as trades_replace.js.');
    process.exit(1);
  }
  if (!fs.existsSync(templatePath)) {
    console.error('Could not find trades_business_template.html. Make sure it exists in the same directory.');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  let html = fs.readFileSync(templatePath, 'utf8');

  // Replace all {{TOKEN}} placeholders using replacer functions (safe with $ in values)
  for (const [key, val] of Object.entries(config)) {
    html = html.replaceAll(`{{${key}}}`, () => String(val));
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);

  console.log('Built: ' + outputPath);
  console.log('  Template reskinned with values for: ' + config.HERO_BUSINESS_NAME);
} catch (err) {
  if (err instanceof SyntaxError) {
    console.error('Invalid JSON in trades_config.json. Check for missing commas or quotes.');
  } else {
    console.error('Error: ' + err.message);
  }
  process.exit(1);
}
