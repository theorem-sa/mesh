import { createHash } from "node:crypto";
import { chmod, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { get } from "node:https";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { gunzipSync } from "node:zlib";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function platformTarget() {
  const os = { darwin: "darwin", linux: "linux", win32: "windows" }[process.platform];
  const arch = { x64: "amd64", arm64: "arm64" }[process.arch];

  if (!os || !arch || (os === "windows" && arch === "arm64")) {
    throw new Error(`Theorem Mesh does not support ${process.platform}/${process.arch}`);
  }

  return { os, arch };
}

function download(url, redirects = 0) {
  return new Promise((accept, reject) => {
    get(url, { headers: { "user-agent": "theorem-mesh-npm" } }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        if (redirects >= 5) {
          reject(new Error("Too many download redirects"));
          return;
        }
        accept(download(new URL(response.headers.location, url), redirects + 1));
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Download failed with HTTP ${response.statusCode}: ${url}`));
        return;
      }

      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => accept(Buffer.concat(chunks)));
      response.on("error", reject);
    }).on("error", reject);
  });
}

function extractBinary(archive, wantedName) {
  const tar = gunzipSync(archive);

  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/, "");
    if (!name) break;

    const sizeText = header.subarray(124, 136).toString("ascii").replace(/\0.*$/, "").trim();
    const size = Number.parseInt(sizeText || "0", 8);
    const bodyOffset = offset + 512;

    if (name.split("/").at(-1) === wantedName) {
      return tar.subarray(bodyOffset, bodyOffset + size);
    }

    offset = bodyOffset + Math.ceil(size / 512) * 512;
  }

  throw new Error(`${wantedName} was not present in the release archive`);
}

export async function install() {
  const packageJson = JSON.parse(await readFile(resolve(packageRoot, "package.json"), "utf8"));
  const { os, arch } = platformTarget();
  const executableName = os === "windows" ? "theorem-mesh.exe" : "theorem-mesh";
  const version = packageJson.version;
  const archiveName = `theorem-mesh_${version}_${os}_${arch}.tar.gz`;
  const releaseRoot = `https://github.com/theorem-sa/mesh/releases/download/v${version}`;

  const [archive, checksumFile] = await Promise.all([
    download(`${releaseRoot}/${archiveName}`),
    download(`${releaseRoot}/checksums.txt`),
  ]);

  const expectedChecksum = checksumFile
    .toString("utf8")
    .split(/\r?\n/)
    .map((line) => line.trim().split(/\s+/))
    .find((parts) => parts.at(-1) === archiveName)?.[0];

  if (!expectedChecksum) {
    throw new Error(`No checksum was published for ${archiveName}`);
  }

  const actualChecksum = createHash("sha256").update(archive).digest("hex");
  if (actualChecksum !== expectedChecksum) {
    throw new Error(`Checksum verification failed for ${archiveName}`);
  }

  const binary = extractBinary(archive, executableName);
  const vendorDirectory = resolve(packageRoot, "vendor");
  const destination = resolve(vendorDirectory, executableName);
  const temporary = `${destination}.download`;

  await mkdir(vendorDirectory, { recursive: true });
  await rm(temporary, { force: true });
  await writeFile(temporary, binary, { mode: 0o755 });
  await chmod(temporary, 0o755);
  await rename(temporary, destination);

  console.log(`Installed Theorem Mesh ${version} for ${os}/${arch}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  install().catch((error) => {
    console.error(`Unable to install Theorem Mesh: ${error.message}`);
    process.exit(1);
  });
}
