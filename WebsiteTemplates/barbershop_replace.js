const fs = require('fs');
const path = require('path');

const configFile = process.argv[2] || 'barbershop_config.json';
const configPath = path.join(__dirname, configFile);
const templatePath = path.join(__dirname, 'barbershop_template.html');
const outputArg = process.argv[3];
const outputPath = outputArg
  ? path.resolve(process.cwd(), outputArg)
  : path.join(__dirname, 'barbershop_output', 'index.html');

try {
  if (!fs.existsSync(configPath)) {
    console.error('Could not find barbershop_config.json. Make sure it exists in the same directory.');
    process.exit(1);
  }
  if (!fs.existsSync(templatePath)) {
    console.error('Could not find barbershop_template.html. Make sure it exists in the same directory.');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  let html = fs.readFileSync(templatePath, 'utf8');

  // Replace all {{TOKEN}} placeholders using replacer functions (safe against $ in values)
  for (const [key, val] of Object.entries(config)) {
    html = html.replaceAll(`{{${key}}}`, () => String(val));
  }

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, html);

  console.log(`Built: ${outputPath}`);
  console.log(`  Template reskinned with values for: ${config.HERO_BUSINESS_NAME}`);
} catch (err) {
  if (err instanceof SyntaxError) {
    console.error('Invalid JSON in barbershop_config.json. Check for missing commas or quotes.');
  } else {
    console.error('Error: ' + err.message);
  }
  process.exit(1);
}
