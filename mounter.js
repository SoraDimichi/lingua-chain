import { exec } from "child_process";
import { writeFileSync } from "fs";

const forgeCommand =
  "forge script --rpc-url http://127.0.0.1:8545 ./script/DeployLCTGovernance.sol:DeployLCTGovernance --broadcast --unlocked 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --sender 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --via-ir";

new Promise((resolve, reject) =>
  exec(forgeCommand, (error, stdout, stderr) =>
    error ? reject(error) : resolve({ stdout, stderr }),
  ),
)
  .then((result) => {
    console.log(result.stdout);
    const envData = result.stdout
      .split("\n")
      .filter((line) => {
        const trimmed = line.trim();
        return (
          trimmed.startsWith("VITE_LCTOKEN=") ||
          trimmed.startsWith("VITE_LCTGOVERNANCE=")
        );
      })
      .map((line) => line.replace(/\s/g, ""))
      .join("\n");
    writeFileSync(".env", envData, "utf8");
  })
  .catch((error) => console.error(error));
