# Theorem Mesh

Theorem Mesh is the command-line private-network agent used by Theorem Harness.
It connects desktops, servers, and other execution machines to the self-hosted
Theorem mesh without requiring a dashboard or desktop VPN client.

This repository is derived from NetBird's pre-AGPL BSD-licensed codebase. Core
Go module names and wire protocols stay compatible; user-facing commands,
service names, storage paths, sign-in page, and default Theorem endpoints are
branded at the product boundary.

## Develop locally

Requirements: Go 1.23 or newer.

```sh
git clone https://github.com/theorem-sa/mesh.git
cd mesh
go build -o theorem-mesh ./client
./theorem-mesh version
./theorem-mesh up
```

Interactive `up` opens Pocket ID sign-in against `mesh.theorem.sa`. For a
headless server, use a setup key issued by the management service:

```sh
sudo theorem-mesh service install
sudo theorem-mesh up --setup-key <key>
```

The default service is `theorem-mesh`. Product state is stored separately from
an existing NetBird installation.

## Install with npm

The npm installer downloads and verifies the correct release binary for macOS,
Linux, or Windows:

```sh
npm install --global @theorem-sa/mesh
theorem-mesh version
```

## Scope

The first release is the cross-platform peer agent. The management, signal,
relay, and TURN components remain deployable from this source tree but are
operated as Theorem infrastructure rather than end-user products.

## Release

`.goreleaser.theorem.yaml` builds the `theorem-mesh` CLI for macOS, Linux, and
Windows. Running it locally does not publish anything.

## License and attribution

See the [BSD 3-Clause License](LICENSE) and
[third-party attributions](THIRD_PARTY_ATTRIBUTIONS.md).
