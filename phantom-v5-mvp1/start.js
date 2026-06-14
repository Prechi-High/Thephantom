import { spawn } from "child_process";
import open from "open";

console.log("--------------------------------------------------");
console.log("🚀 BOOTING THE PHANTOM V5 MVP1 ENGINE");
console.log("--------------------------------------------------");

const devServer = spawn("npm", ["run", "dev"], {
  stdio: "inherit",
  shell: true,
});

// Wait for server to boot, then open browser automatically
setTimeout(() => {
  console.log("\n🌐 Arena Link Ready: http://localhost:5173");
  open("http://localhost:5173");
}, 4000);
