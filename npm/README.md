# Theorem Mesh CLI

Install the peer agent globally:

```sh
npm install --global @theorem-sa/mesh
```

Connect a desktop interactively:

```sh
theorem-mesh service install
theorem-mesh service start
theorem-mesh up
```

Connect a headless server with a one-time setup key:

```sh
sudo theorem-mesh service install
sudo theorem-mesh service start
sudo theorem-mesh up --setup-key <key>
```

The npm package downloads the matching checksummed binary from the corresponding
[Theorem Mesh GitHub release](https://github.com/theorem-sa/mesh/releases).
