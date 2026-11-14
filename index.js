const REQUESTS = 10;

const rawUrl = process.argv[2];

let url;
try {
  url = new URL(rawUrl);
} catch {
  console.error(
    "Использование: node index.js <url>\nПример:       node index.js https://speed.cloudflare.com/__down?bytes=5000000",
  );
  process.exit(1);
}

console.log(`Адрес: ${url.href}`);
console.log(
  `Запросов: ${REQUESTS}, по очереди, каждый до полного тела ответа`,
);
console.log("");

let totalBytes = 0;
let totalMs = 0;

for (let i = 1; i <= REQUESTS; i += 1) {
  const started = performance.now();

  let response;
  let body;
  try {
    response = await fetch(url, {
      headers: {
        "Accept-Encoding": "identity",
        "Cache-Control": "no-cache",
      },
    });
    body = await response.arrayBuffer();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`Запрос ${i} не удался: ${reason}`);
    process.exit(1);
  }

  const elapsedMs = performance.now() - started;

  if (response.status < 200 || response.status >= 300) {
    console.error(`Запрос ${i} завершился с HTTP ${response.status}`);
    process.exit(1);
  }

  totalBytes += body.byteLength;
  totalMs += elapsedMs;

  const mebibytes = (body.byteLength / 1024 / 1024).toFixed(2);
  console.log(
    `[${String(i).padStart(2)}/${REQUESTS}] HTTP ${response.status}, ${elapsedMs.toFixed(1)} ms, ${mebibytes} MiB`,
  );
}

const totalSeconds = totalMs / 1000;
const speed = (totalBytes * 8) / totalSeconds / 1_000_000;
const megabitsPerSecond = Number.isFinite(speed) ? speed : 0;

console.log("");
console.log(`Среднее время запроса: ${(totalMs / REQUESTS).toFixed(1)} ms`);
console.log(
  `Общий объём:           ${(totalBytes / 1024 / 1024).toFixed(2)} MiB (${totalBytes} байт)`,
);
console.log(`Суммарное время:       ${totalSeconds.toFixed(2)} s`);
console.log(`Скорость скачивания:   ${megabitsPerSecond.toFixed(2)} Mbit/s`);
