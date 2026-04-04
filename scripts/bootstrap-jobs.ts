const runtimeUrl = process.env.RUNTIME_API_URL ?? 'http://localhost:4100';
const governorates = (process.env.SEED_GOVERNORATES ?? 'Baghdad').split(',').map((v) => v.trim()).filter(Boolean);
const cities = (process.env.SEED_CITIES ?? 'Baghdad').split(',').map((v) => v.trim()).filter(Boolean);
const categories = (process.env.SEED_CATEGORIES ?? 'restaurants,cafes').split(',').map((v) => v.trim()).filter(Boolean);
const maxAttempts = Number(process.env.SEED_MAX_ATTEMPTS ?? '3');

const main = async () => {
  const response = await fetch(`${runtimeUrl}/jobs/bootstrap`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ governorates, cities, categories, max_attempts: maxAttempts }),
  });

  const payload = await response.json();
  if (!response.ok) {
    console.error('Bootstrap failed:', payload);
    process.exit(1);
  }

  console.log('Bootstrap complete:', payload);
};

void main();
