const pistonBaseUrl = process.env.PISTON_BASE_URL ?? "http://localhost:2001";

const runtimesToInstall = [
  { language: "gcc", version: "10.2.0", label: "C++ (via gcc)" },
  { language: "java", version: "15.0.2", label: "Java" },
];

async function installRuntime(runtime) {
  const response = await fetch(`${pistonBaseUrl}/api/v2/packages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      language: runtime.language,
      version: runtime.version,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    if (response.status === 500 && text.includes("Already installed")) {
      console.log(`${runtime.label} is already installed.`);
      return;
    }

    throw new Error(
      `Failed to install ${runtime.label}: ${response.status} ${text}`,
    );
  }

  const json = await response.json();
  console.log(`Installed ${runtime.label}:`, json);
}

async function main() {
  for (const runtime of runtimesToInstall) {
    console.log(`Installing ${runtime.label}...`);
    await installRuntime(runtime);
  }

  console.log("Piston runtimes are ready.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
