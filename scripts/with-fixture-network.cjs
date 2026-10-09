const { withAndroidManifest, withDangerousMod } = require("expo/config-plugins");
const { mkdir, writeFile } = require("node:fs/promises");
const { join } = require("node:path");
// This opt-in fixture package talks only to the Android emulator's host-loopback fixture.
module.exports = config => {
  config = withAndroidManifest(config, value => {
  const application = value.modResults.manifest.application?.[0];
  if (!application) throw new Error("Android application manifest is missing.");
  application.$["android:usesCleartextTraffic"] = "false";
  application.$["android:networkSecurityConfig"] = "@xml/openjm_fixture_network";
  return value;
  });
  return withDangerousMod(config, ["android", async value => {
    const destination = join(value.modRequest.platformProjectRoot, "app", "src", "main", "res", "xml");
    await mkdir(destination, {recursive:true});
    await writeFile(join(destination,"openjm_fixture_network.xml"), `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false" />
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="false">10.0.2.2</domain>
  </domain-config>
</network-security-config>
`);
    return value;
  }]);
};
